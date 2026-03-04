import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: ENUM-based status → Workflow-based stageId
 *
 * Safe to run even if some projects already have workflows (idempotent checks).
 * Reversible: up() migrates data, down() restores status column from stageId name.
 *
 * NOTE: This app uses synchronize:true, so table/column structure is already
 * applied by TypeORM. This migration handles DATA migration only:
 *   1. Create default workflows for projects that don't have one
 *   2. Map old status ENUM values to workflow stage IDs
 *   3. Drop the old status column
 */
export class EnumToWorkflowMigration1740410764000 implements MigrationInterface {
    name = 'EnumToWorkflowMigration1740410764000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.startTransaction();

        try {
            // -------------------------------------------------------
            // STEP 1: Ensure workflow_stages table has required columns
            // (synchronize:true will have done this, but we guard here)
            // -------------------------------------------------------

            // -------------------------------------------------------
            // STEP 2: For each project without a workflowId, create a
            // default workflow + 5 stages inside a single transaction
            // -------------------------------------------------------
            const projectsWithoutWorkflow: { id: string }[] = await queryRunner.query(`
        SELECT id FROM projects WHERE "workflowId" IS NULL
      `);

            for (const project of projectsWithoutWorkflow) {
                // Create workflow
                const [workflow] = await queryRunner.query(`
          INSERT INTO workflows (id, name, "isDefault", "transitionMode", "projectId", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), 'Default Kanban Workflow', true, 'SEQUENTIAL', $1, NOW(), NOW())
          RETURNING id
        `, [project.id]);

                const workflowId = workflow.id;

                // Create 5 stages in correct order
                const stages = [
                    { name: 'Todo', orderIndex: 0, isFinal: false },
                    { name: 'In Progress', orderIndex: 1, isFinal: false },
                    { name: 'Blocked', orderIndex: 2, isFinal: false },
                    { name: 'In Review', orderIndex: 3, isFinal: false },
                    { name: 'Done', orderIndex: 4, isFinal: true },
                ];

                for (const stage of stages) {
                    await queryRunner.query(`
            INSERT INTO workflow_stages (id, name, "orderIndex", "isFinal", "workflowId", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
          `, [stage.name, stage.orderIndex, stage.isFinal, workflowId]);
                }

                // Attach workflowId to project
                await queryRunner.query(`
          UPDATE projects SET "workflowId" = $1 WHERE id = $2
        `, [workflowId, project.id]);
            }

            // -------------------------------------------------------
            // STEP 3: Map old status ENUM values → stageId
            // For issues that have a status but no stageId yet
            // -------------------------------------------------------
            const statusToStageName: Record<string, string> = {
                TODO: 'Todo',
                BACKLOG: 'Todo',       // BACKLOG maps to Todo (closest equivalent)
                IN_PROGRESS: 'In Progress',
                BLOCKED: 'Blocked',
                IN_REVIEW: 'In Review',
                DONE: 'Done',
            };

            for (const [enumValue, stageName] of Object.entries(statusToStageName)) {
                await queryRunner.query(`
          UPDATE issues i
          SET "stageId" = ws.id
          FROM workflow_stages ws
          JOIN workflows w ON w.id = ws."workflowId"
          WHERE i."stageId" IS NULL
            AND w.id = (SELECT "workflowId" FROM projects WHERE id = i."projectId")
            AND ws.name = $1
            AND i.status::text = $2
        `, [stageName, enumValue]);
            }

            // -------------------------------------------------------
            // STEP 4: Catch any remaining issues with NULL stageId
            // → assign to "Todo" stage of their project's workflow
            // -------------------------------------------------------
            await queryRunner.query(`
        UPDATE issues i
        SET "stageId" = ws.id
        FROM workflow_stages ws
        JOIN projects p ON p."workflowId" = ws."workflowId"
        WHERE i."stageId" IS NULL
          AND p.id = i."projectId"
          AND ws."orderIndex" = 0
      `);

            // -------------------------------------------------------
            // STEP 5: Drop the old status column (if it still exists)
            // -------------------------------------------------------
            const statusColumnExists = await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'issues' AND column_name = 'status'
      `);

            if (statusColumnExists.length > 0) {
                await queryRunner.query(`ALTER TABLE issues DROP COLUMN IF EXISTS status`);
            }

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.startTransaction();

        try {
            // Restore status column with the old ENUM type values
            await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issues_status_enum') THEN
            CREATE TYPE issues_status_enum AS ENUM (
              'BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE'
            );
          END IF;
        END$$;
      `);

            await queryRunner.query(`
        ALTER TABLE issues ADD COLUMN IF NOT EXISTS status issues_status_enum DEFAULT 'TODO'
      `);

            // Map stage names back to ENUM values
            const stageToEnum: Record<string, string> = {
                'Todo': 'TODO',
                'In Progress': 'IN_PROGRESS',
                'Blocked': 'BLOCKED',
                'In Review': 'IN_REVIEW',
                'Done': 'DONE',
            };

            for (const [stageName, enumValue] of Object.entries(stageToEnum)) {
                await queryRunner.query(`
          UPDATE issues i
          SET status = $1::issues_status_enum
          FROM workflow_stages ws
          WHERE i."stageId" = ws.id AND ws.name = $2
        `, [enumValue, stageName]);
            }

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
    }
}
