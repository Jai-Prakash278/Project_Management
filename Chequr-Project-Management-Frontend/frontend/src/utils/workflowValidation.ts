import { Workflow, Stage, Transition, WorkflowMode } from '../types/issue.types';

export interface ValidateTransitionParams {
    fromStage: Stage;
    toStage: Stage;
    workflow?: Workflow;
    transitions: Transition[];
    currentUserRoles?: string[];
}

export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

/**
 * Validates if a transition between two stages is allowed based on the workflow configuration.
 */
export const validateTransition = ({
    fromStage,
    toStage,
    workflow,
    transitions,
    currentUserRoles
}: ValidateTransitionParams): ValidationResult => {
    // If no workflow is defined, we allow the transition (fallback)
    if (!workflow) {
        return { isValid: true };
    }

    // Same stage transition is always allowed (reordering within column)
    if (fromStage.id === toStage.id) {
        return { isValid: true };
    }

    if (workflow.transitionMode === WorkflowMode.SEQUENTIAL) {
        // Sequential mode: Allow only if exactly 1 step forward or backward
        const diff = Math.abs(toStage.orderIndex - fromStage.orderIndex);

        if (diff === 1) {
            return { isValid: true };
        }


        return {
            isValid: false,
            errorMessage: 'Stage skipping is not allowed in Sequential mode.'
        };
    }

    if (workflow.transitionMode === WorkflowMode.FLEXIBLE) {
        // If no transitions are defined in the backend, we allow everything (permissive fallback)
        if (!transitions || transitions.length === 0) {
            return { isValid: true };
        }

        // Flexible mode: Check if transition is defined
        const transition = transitions.find(
            (t) => (t.fromStageId === fromStage.id && t.toStageId === toStage.id) ||
                (String(t.fromStageId).toLowerCase().trim() === fromStage.name.toLowerCase().trim()) &&
                (String(t.toStageId).toLowerCase().trim() === toStage.name.toLowerCase().trim())
        );

        if (!transition) {
            return { isValid: true };
        }

        // Check if role is allowed
        if (currentUserRoles && currentUserRoles.length > 0 && transition.allowedRoles && transition.allowedRoles.length > 0) {
            const normalizedUserRoles = currentUserRoles.map(r => r.toLowerCase());
            const hasAccess = transition.allowedRoles.some(role => normalizedUserRoles.includes(role.toLowerCase()));
            if (!hasAccess) {
                return {
                    isValid: false,
                    errorMessage: 'Your role is not allowed to perform this transition.'
                };
            }
        }

        // If no roles specified, or role is allowed
        return { isValid: true };
    }

    // Default fallback
    return { isValid: true };
};
