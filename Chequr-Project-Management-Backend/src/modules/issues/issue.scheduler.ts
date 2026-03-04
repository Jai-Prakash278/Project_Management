import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IssueService } from './issue.service';

@Injectable()
export class IssueScheduler {
    private readonly logger = new Logger(IssueScheduler.name);

    constructor(private readonly issueService: IssueService) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleOverdueIssues() {
        this.logger.debug('Checking for overdue issues...');
        const count = await this.issueService.checkOverdueIssues();
        this.logger.debug(`Reverted ${count} overdue issues to BACKLOG.`);
    }
}
