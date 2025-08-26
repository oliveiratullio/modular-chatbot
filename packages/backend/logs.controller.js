var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AgentLogsRepository } from './dist/repositories/agent-logs.repo.js';
let LogsController = class LogsController {
    constructor(repo) {
        this.repo = repo;
    }
    async tail(conversation_id, n = 100) {
        const items = await this.repo.tail(conversation_id, n);
        return { conversation_id, count: items.length, items };
    }
};
__decorate([
    Get(':conversation_id'),
    __param(0, Param('conversation_id')),
    __param(1, Query('n', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "tail", null);
LogsController = __decorate([
    Controller('logs'),
    __metadata("design:paramtypes", [AgentLogsRepository])
], LogsController);
export { LogsController };
//# sourceMappingURL=logs.controller.js.map