import {retainRestoreFileProtection} from './host/file-restore-protection.ts';
import {AutoUpdateConfig,autoUpdateDefaults,editAutoUpdateProfile,RoleCompanionAutoUpdater,validateAutoUpdateProfile,type PluginManagerPort} from './host/auto-update.ts';
import {restoreDeliveryEligible,restoreConfirmation,type RestoreConfirmation} from './home/restore-acceptance.ts';
import {restoreRegistrationIds} from './runtime/restore-registration.ts';
import {validAutonomyRules} from './home/autonomy.ts';
import {autonomyView,activityRecordPart} from './host/autonomy-view.ts';
import type {AutonomyRulesEditRequest,WakeRoleRequest,AutonomyView,AutonomyScheduleView,ActivityRecordRead,ActivityRecordPart,AutonomyPauseRequest,ClockReviewRequest,AutonomyAttributionRequest,AutonomyAttributionView} from './types.autonomy.ts';
import type {WakeReceipt} from './runtime/index.ts';
import {validateHandoverRequest,type HandoverRequest,type HandoverProgress} from './home/handovers.ts';
import {readRestoreProfile,emptyRestoreProfile,type RestoreProfilePointer} from './host/restore-profile.ts';
import {validateRestoreRequest,sameRestoreRequest,type RestoreRequest,type RestoreRead,type RestoreProgress} from './home/restores.ts';
import {restoreRoleBackup,readRoleRestore,type DiagnosticRoleHome} from './home/index.ts';
import type {RolePorts} from './runtime/index.ts';
import {knowledgeRollbackCommand} from './home/knowledge-owner.ts';
import {admitCleanupSelection,admitCleanupCommand,type CleanupSelection,type CleanupCommand,type CleanupPreview,type CleanupProgress,type CleanupWaiting} from './home/cleanup.ts';
import {maintenanceHealth} from './host/library-maintenance-view.ts';
import type {CleanupCatalogPageRequest,LibraryMaintenanceView} from './types.ts';
import type {KnowledgeRollbackRequest,KnowledgeDifferenceRequest,KnowledgeDifference} from './types.ts';
import {validateProposalRules} from './home/proposal-rules.ts';
import type {ProposalRulesView,ProposalRulesEditRequest} from './types.ts';
import {validateContactRules} from './home/contact-rules.ts';
import {contactView,contactIntentPart} from './host/contact-view.ts';
import type {ContactView,ContactIntentPart as ContactIntentPartView,ContactIntentRead,ContactRulesEditRequest} from './types.contact.ts';
import {fileProtectionCache,closeFileProtectionCache,withFileProfileEdit} from './host/file-protection-cache.ts';
import {realpath} from 'node:fs/promises';
import {fileMappingDefaults,validateFileMappings,localDirectoryIdentity,mappingStillMatches,type FileMappingProfile,type LocalFileMapping} from './host/file-mappings.ts';
import {editFileMappingProfile} from './host/file-mapping-owner.ts';
import {FileMappingVersion} from './host-contracts.ts';
import {FileAccessVersion,FileGrantId,RunId} from './home/ids.ts';
import type {FileAccessView,FileAccessEditRequest,FileMappingEditRequest} from './types.ts';
import {validateEditFileAccess} from './home/file-access.ts';
import {retainFileProtectionHistory,retainKnownFileHome,knownFileHomes} from './adapters/file-protection.ts';
import {createRoleFilePort} from './adapters/file-port.ts';
import {HomeRevision} from './home/ids.ts';
import {QQHistoryQueryId,QQHistoryCandidateId} from './home/qq-history.ts';
import type {ContextSourcePageRequest,ContextSourcePage,ContextSourceRead,ContextSourcePart} from './home/context-snapshot.ts';
import type {LibrarySourceQuery,LibrarySourcePage} from './types.library.sources.ts';
import type {KnowledgePageRequest,KnowledgePage,KnowledgeRecordRead,KnowledgeRecordPart,KnowledgeLibraryQuery,KnowledgeLibraryPage,KnowledgeLibraryDetailRequest,KnowledgeLibraryDetail} from './types.ts';
import {knowledgePage,knowledgeRecordPart,knowledgeDifference} from './host/knowledge-view.ts';
import {queryKnowledgeLibrary,readKnowledgeLibraryDetail} from './host/library-knowledge-view.ts';
import {validateResolveDelivery} from './home/delivery-resolutions.ts';
import {readStableExecutionRecord} from './host/execution-record.ts';
import {executionLibraryPage,nativeRecordSummary,readExecutionLibraryDetail,readExecutionLibraryPart,toolAttemptSummary,validateExecutionLibraryQuery,viewCode} from './host/library-execution-view.ts';
export {executionLibraryPage,readExecutionLibraryDetail,readExecutionLibraryPart,validateExecutionLibraryQuery} from './host/library-execution-view.ts';
import {projectLibraryOverview} from './host/library-overview-view.ts';
import {qqHistoryView,qqHistoryRecord} from './host/qq-history-view.ts';
import type {QQHistorySelectionRequest,QQHistorySelection,QQHistoryQueryRequest,QQHistoryQueryReceipt,QQHistoryReadRequest,QQHistoryView,QQHistoryRecordRead,QQHistoryRecordPage} from './types.ts';
export {readStableExecutionRecord} from './host/execution-record.ts';
import {DeliveryId,validateDeliveryRules,type DeliveryRulesValue} from './home/deliveries.ts';
import type {QQDeliveryResolutionRequest,QQDeliveryRulesEditRequest,QQDeliveriesView,QQDeliveryRead,QQDeliveryPage} from './types.ts';
import {validateWebRules} from './home/web.ts';
import type {WebRulesView,WebRulesEditRequest} from './types.ts';
import type {BackupRequest,BackupProgress} from './home/backups.ts';
import type {FormatUpgradePreview,FormatUpgradeProgress,FormatUpgradeRequest} from './home/format-upgrade.ts';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createQQReceiveAdapter,qqUnavailableView,type QQReceiveAdapter,type QQReceiveView} from './adapters/onebot.ts';
import {qqProfileDefaults,qqTransportFields,validateQQProfile,type QQProfileRecord} from './host/qq-profile.ts';
import {editQQProfile,prepareQQProfile} from './host/qq-owner.ts';
import {QQProfileVersion} from './host-contracts.ts';
import {QQConnectionId,QQAccountId,QQPeerId,plainExact,type QQBinding} from './home/qq.ts';
import {credentialRef} from '@deepseek-ai/dsh-credentials';
import type {QQConnectionView,QQConnectionEditRequest,QQBindingEditRequest} from './types.ts';
export {createQQReceiveAdapter} from './adapters/onebot.ts';
import {conversationBudgetView} from './home/budget-view.ts';
import {NativeRecordRef} from './home/ids.ts';
import { ProfileSelectionVersion } from './host-contracts.ts';
import { RoleId, OperationId, BindingVersion } from './home/ids.ts';
import {installNativeOwnershipFence} from './adapters/native-ownership.ts';
import {safeExecutionCode} from './runtime/execution.ts';
export type {NativeHostIO} from './adapters/native-spill.ts';
export {createNativeExecution} from './adapters/native.ts';
export {approvedPostEntry} from './adapters/native-composition.ts';
import {createNativeExecution} from './adapters/native.ts';
import { createHash } from 'node:crypto';
import { createRoleHome, validateInputSettings, validateConversationSettings, validateReadRules, validateFileRules, validateRetryRules, openRoleHome, openRoleHomeForRuntime, diagnoseRoleHome, HomeError, type OpenedRoleHome, type CreateHomeRequest, type HomeOperation, type ProjectionId, type ProjectionPreview, type ProjectionCommand, type HomeDiagnostic, type PreservedProjection,type AttemptRecord,type NativeRecord } from './home/index.ts';
import type {} from '@deepseek-ai/dsh-config-editor';
import { statSync, readFileSync } from 'node:fs';
import {dirname} from 'node:path';
import { getDshRuntimeVersion } from '@deepseek-ai/dsh-app-boot';
export const supportedDshVersions = Object.freeze(['0.2.1-rc.2', '0.2.1-rc.3'] as const);
export function supportsDshVersion(version: string): boolean {
    return (supportedDshVersions as readonly string[]).includes(version);
}
export {autoUpdateSpec,autoUpdateWorkerSource,bundledPnpmCommand,cancelPendingDesktopInstall,prepareAutoUpdateProfile,requestDesktopRelaunch,RoleCompanionAutoUpdater,validateAutoUpdateProfile,validateAutoUpdateValue} from './host/auto-update.ts';
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type {} from '@deepseek-ai/dsh-commands';
import type { PluginInventoryGateway } from '@deepseek-ai/dsh-host-plugin-inventory';
import { startRole, type RoleView, type RunningRole, type OwnerReceipt } from './runtime/index.ts';
export const name = 'role-companion';
export const inject = ['pluginInventory', 'commands'];
const QQConfig=Schema.object({enabled:Schema.boolean().default(false),connectionId:Schema.string().default(''),endpoint:Schema.string().default(''),credentialRef:Schema.string().default(''),maxFrameBytes:Schema.number().default(1048576),readTimeoutMs:Schema.number().default(10000),reconnectInitialMs:Schema.number().default(1000),reconnectMaxMs:Schema.number().default(60000),jitterRatio:Schema.number().default(0.2),historyPageSize:Schema.number().default(50),historyMaxPages:Schema.number().default(3),historyCooldownMs:Schema.number().default(60000),version:Schema.number().default(0),lastOperationId:Schema.string().default('')}).default({...qqProfileDefaults}).volatile();
const FileMappingsConfig=Schema.object({protectionCacheId:Schema.string().default(''),version:Schema.number().default(0),lastOperationId:Schema.string().default(''),entries:Schema.array(Schema.object({grantId:Schema.string(),roleId:Schema.string(),homeRoot:Schema.string(),homeFingerprint:Schema.string(),path:Schema.string(),pathFingerprint:Schema.string(),operationId:Schema.string()})).default([])}).default({...fileMappingDefaults,entries:[]}).volatile();
const RestoreConfig=Schema.object({operationId:Schema.string().default(''),backupPath:Schema.string().default(''),destination:Schema.string().default(''),expectedRoleId:Schema.string().default(''),expectedManifestDigest:Schema.string().default(''),requestedProfileVersion:Schema.number().default(0)}).default({...emptyRestoreProfile}).volatile();
export const Config = Schema.object({ restoration:RestoreConfig, fileMappings:FileMappingsConfig, qq:QQConfig, update:AutoUpdateConfig, bootstrap: Schema.object({ path: Schema.string().default(''), roleId: Schema.string().default(''), creationOperationId: Schema.string().default(''), registrationOperationId: Schema.string().default(''), version: Schema.number().default(0) }).default({ path: '', roleId: '', creationOperationId: '', registrationOperationId: '', version: 0 }).volatile() });
export type Config = ReturnType<typeof Config>;
export type { CompanionView } from './types.ts';
import type {StopRequest} from './home/stops.ts';
import type { CreateHomeInput,OwnerEditInput,CompanionView, HomeConnectReceipt, BootstrapSelection, PanelInputRequest, InputListView, InputReceipt, InputPageRequest,ConversationView,ReplyPage,ReplyRead,ConversationEditRequest,ConversationPage,ExecutionRecordRead,ExecutionRecordPage,ArchiveRetryReceipt,FileRulesView,FileRulesEditRequest,ReadRulesView,ReadRulesEditRequest,RetryRulesView,RetryRulesEditRequest,OwnerExecutionRecordPage,AutoUpdateEditRequest,AutoUpdateProfile,AutoUpdateView,ExecutionLibraryQuery,ExecutionLibraryPage,ExecutionLibraryDetailRequest,ExecutionLibraryDetail,ExecutionLibraryPartRequest,ExecutionLibraryPart } from './types.ts';
const viewObject=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const viewField=(value:unknown,key:string):unknown=>viewObject(value)?value[key]:undefined;
declare module '@deepseek-ai/cordis' {
    interface Context {
        roleCompanion: RoleCompanionController;
        pluginInventory: PluginInventoryGateway;
    }
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface RemoteErrorDetailsMap {
        'role/owner-required': {
            readonly action: string;
        };
        'role/home-error': {
            readonly reason: string;
        };
    }
}
/** Only this authenticated adapter receives the owner capability. */
export class RoleCompanionController extends TypertRemoteService {
    static inject = ['pluginInventory', 'commands'];
    private role: Promise<RunningRole>;
    private home: OpenedRoleHome | undefined;
    private homePath = '';
    private diagnosticExpectedRoleId = '';
    private bootError = '';
    private serial: Promise<unknown> = Promise.resolve();
    private restoreSelecting=false;
    private restoreCall:{request:RestoreRequest;task:Promise<RestoreProgress>}|undefined;
    private closing = false;
    private qq:QQReceiveAdapter|undefined;
    private qqBindingVersion:BindingVersion|0=0;
    private qqBindingView:QQBinding|null=null;
    private qqError='';
    private qqRestart?:{readonly id:symbol;readonly role:RunningRole;readonly rolePromise:Promise<RunningRole>;readonly selection:string;readonly profile:string;readonly operationId:OperationId};
    private readonly qqEditContext=new AsyncLocalStorage<symbol>();
    private readonly autoUpdate:RoleCompanionAutoUpdater;
    /** Host-only cancellation; maintenance and explicit owner stops cannot authorize a restart. */
    cancelQQRestart():void{this.qqRestart=undefined;}
    private selectionKey():string{return JSON.stringify(this.config.bootstrap.get());}
    private profileSelectsHome(roleId:RoleId,path=this.homePath):boolean{const selection=this.config.bootstrap.get();return !!path&&!!roleId&&selection.path===path&&selection.roleId===roleId;}
    private readonly nativeExecution:()=>ReturnType<typeof createNativeExecution>;
    constructor(ctx: Context, private readonly config: Config) {
        super(ctx, 'roleCompanion');
        installNativeOwnershipFence(ctx);
        retainFileProtectionHistory(ctx);
        this.nativeExecution=()=>createNativeExecution(ctx);
        this.autoUpdate=new RoleCompanionAutoUpdater({
            profile:()=>this.updateProfile(),
            manager:()=>this.ctx.get('pluginManager') as unknown as PluginManagerPort|undefined,
            profileDir:()=>{const editor=this.ctx.get('configEditor');if(!editor)throw new HomeError('PROFILE_EDITOR_UNAVAILABLE');return dirname(editor.documentPath);},
            runtimeVersion:()=>getDshRuntimeVersion(),
        });
        this.role = this.boot();
        ctx.on('loader/partial-dispose',()=>{if(this.qqRestart&&this.qqEditContext.getStore()!==this.qqRestart.id)this.cancelQQRestart();},{global:true,prepend:true});
        ctx.on('loader/volatile-update',()=>{if(this.qqRestart&&this.qqEditContext.getStore()!==this.qqRestart.id)this.cancelQQRestart();},{global:true,prepend:true});
        ctx.on('loader/volatile-update',()=>this.autoUpdate.reschedule(true),{global:true,prepend:true});
        ctx.effect(()=>{this.autoUpdate.start();return()=>this.autoUpdate.close();},'role-companion: auto update');
        ctx.commands.register({ name: 'role', description: '打开角色面板的指引', handler: () => ({ kind: 'success', text: '请在「设置 → DSH 角色伙伴」打开角色面板。普通工作 Session 不会自动归入角色。' }) });
        ctx.effect(() => async () => {
            this.closing = true;this.cancelQQRestart();
            const initial = await this.role;
            initial.lifetime.requestStop('unload');
            await this.serial;
            // A handoff already inside the queue may have published another lifetime.
            const latest = await this.role;
            latest.lifetime.requestStop('unload');
            await Promise.all([initial.lifetime.stopped,latest.lifetime.stopped]);await closeFileProtectionCache(this.ctx);
        }, 'role-companion: ordered shutdown');
    }
    /** Read installation and role readiness without starting work. */
    @Remote
    async inspect(): Promise<CompanionView> {
        this.requireOwner('inspect');
        const inventory = await this.ctx.pluginInventory.list();
        const entry = inventory.entries.find(row => row.moduleName === 'dsh-role-companion');
        const pointer=this.restorePointer(),restorationRequest=pointer?{request:{operationId:pointer.operationId,backupPath:pointer.backupPath,destination:pointer.destination,expectedRoleId:pointer.expectedRoleId,expectedManifestDigest:pointer.expectedManifestDigest},profileVersion:pointer.requestedProfileVersion}:undefined;
        const roleView=await (await this.role).runtime.inspect(),restoration=restorationRequest?await this.restoreProgress():undefined;
        const restorable=this.home&&roleView.status!=='stopping'&&roleView.status!=='stopped'?this.home:undefined;
        const restorationHandover=restorable?.handoverSnapshots().find(record=>record.stopOperationId===restoration?.sourceStopOperationId),restorationAcceptance=restorable?.restoreAcceptanceSnapshot();
        return {
            packageName: 'dsh-role-companion', packageVersion: '0.1.3', requiredDsh: supportedDshVersions.join(' / '),
            ...(restorationRequest?{restoration,restorationRequest,...(restorationHandover?{restorationHandover}:{}),...(restorationAcceptance?{restorationAcceptance}:{})}:{}),
            installed: true, enabled: entry?.enabled ?? null, fiberPhase: entry?.fiberPhase ?? null,
            role: { ...roleView, ...(this.bootError ? { reason: this.bootError } : {}) }, bootstrap: {...this.config.bootstrap.get(),version:ProfileSelectionVersion(this.config.bootstrap.get().version)}, selectedRoleId: this.selectedRoleId(), qq:{bindingVersion:this.qqBindingVersion,transport:this.qqStatus()}, capabilities: ['official-web-search-fetch','qq-text-replies','qq-bounded-history','status', 'home', 'owner-core', 'owner-input-limit', 'projection-preview', 'projection-management', 'readonly-diagnostic', 'persistent-panel-input','native-panel-conversation','owner-reply-read','owner-conversation-settings','owner-read-rules','owner-stop','consistent-backup','owner-contact-rules','owner-contact-state','home-format-upgrade']
        };
    }
    private updateProfile():AutoUpdateProfile{
        const value=this.config.update?.get()??autoUpdateDefaults;
        if(!validateAutoUpdateProfile(value))throw new HomeError('INVALID_AUTO_UPDATE');
        return value;
    }
    /** Read the persisted auto-update rule and this process's latest check result. */
    @Remote
    async readAutoUpdate():Promise<AutoUpdateView>{
        this.requireOwner('readAutoUpdate');
        return this.autoUpdate.inspect();
    }
    /** Persist an owner-selected polling rule without remounting the role runtime. */
    @Remote
    async editAutoUpdate(request:AutoUpdateEditRequest):Promise<AutoUpdateView>{
        this.requireOwner('editAutoUpdate');
        await editAutoUpdateProfile(this.ctx,()=>this.updateProfile(),request);
        this.autoUpdate.reschedule(true);
        return this.autoUpdate.inspect();
    }
    /** Check the fixed main branch and install its exact commit when different. */
    @Remote
    async checkAutoUpdate():Promise<AutoUpdateView>{
        this.requireOwner('checkAutoUpdate');
        return this.autoUpdate.check();
    }
    /** Queue the checked main commit, relaunch after installation, and restart the desktop app. */
    @Remote
    async applyAutoUpdate():Promise<AutoUpdateView>{
        this.requireOwner('applyAutoUpdate');
        return this.autoUpdate.applyAndRestart();
    }
    /** Loader changes retain the volatile reference; Home handoff still stops the old writer first. */
    reconcileBootstrap(): void {
        if(this.restoreSelecting)return;
        const selected=this.config.bootstrap.get();if(selected.path!==this.homePath||selected.roleId!==(this.home?.roleId||this.diagnosticExpectedRoleId))this.cancelQQRestart();
        void this.exclusive(async () => {
            const selected = this.config.bootstrap.get();
            if(this.restoreSelecting)return;
            await this.role;
            if (selected.path === this.homePath && selected.roleId === (this.home?.roleId || this.diagnosticExpectedRoleId))
                return;
            const previous = await this.role;
            previous.lifetime.requestStop('migration');
            await previous.lifetime.stopped;
            if(this.closing)return;
            this.home = undefined;
            this.homePath = '';
            this.diagnosticExpectedRoleId = '';
            this.bootError = '';
            this.role = this.boot();
            await this.role;
        }).catch(error => { this.bootError = this.code(error); });
    }
    private async startOwnedRole(home:OpenedRoleHome|DiagnosticRoleHome|undefined,ports:RolePorts){if(home&&'readSnapshot'in home){this.qqBindingView=(await home.readSnapshot()).qqBinding??null;this.qqBindingVersion=this.qqBindingView?.version??0;}return startRole(home,{...ports,restore:{request:restoreRoleBackup,read:readRoleRestore}});}
    private restorationMatchesHome(roleId:RoleId){const pointer=this.restorePointer();return !!pointer&&pointer.expectedRoleId===roleId&&pointer.destination===this.homePath&&this.home?.roleId===roleId;}
    /** Read-only protocol verification has no delivery/history port and cannot admit an input. */
    private async startRestorePreview(home:OpenedRoleHome):Promise<RunningRole>{
        const binding=(await home.readSnapshot()).qqBinding??null;if(!binding)return this.startOwnedRole(home,{readOnlyAdmission:'RESTORE_LOCAL_REGISTRATION_REQUIRED'});
        let role!:RunningRole;const adapter=createQQReceiveAdapter({configuration:()=>qqTransportFields(this.qqProfile()),configurationVersion:()=>this.qqProfile().version,binding:async()=>(await home.readSnapshot()).qqBinding??null,resolveCredential:async ref=>(await this.ctx.get('credentials')?.resolve(credentialRef(ref)))?.value,receive:input=>role.runtime.receive(input)});
        role=await this.startOwnedRole(home,{readOnlyAdmission:'RESTORE_LOCAL_REGISTRATION_REQUIRED',inbound:adapter});this.qq=adapter;adapter.start();return role;
    }
    private restorePointer():RestoreProfilePointer|undefined{
        const raw=this.ctx.get('configEditor')?.entries().find(entry=>entry.options.name==='dsh-role-companion')?.options.config;
        const field=viewField(raw,'restoration');if(field!==undefined)readRestoreProfile(field);
        return readRestoreProfile(this.config.restoration.get());
    }
    private async restoreProgress():Promise<RestoreProgress>{
        const pointer=this.restorePointer();if(!pointer)throw new HomeError('RESTORE_NOT_FOUND');
        const result=await (await this.role).owner.readRestore(pointer.destination,{operationId:pointer.operationId,expectedRoleId:pointer.expectedRoleId});
        return result.phase==='not-found'?{...result,backupPath:pointer.backupPath,manifestDigest:pointer.expectedManifestDigest,phase:'uncertain',error:'RESTORE_RECONCILIATION_REQUIRED'}:result;
    }
    private async boot(): Promise<RunningRole> {
        this.qq=undefined;this.qqBindingVersion=0;this.qqBindingView=null;this.qqError='';
        const selection = this.config.bootstrap.get();
        if (selection.path) {
            try {
                const opened = await openRoleHomeForRuntime(selection.path, { expectedRoleId: RoleId(selection.roleId) });
                this.homePath = selection.path; this.diagnosticExpectedRoleId = selection.roleId;
                if (!('readSnapshot' in opened)) return this.startOwnedRole(opened, {});
                this.home = opened;
                if(await this.home.readActivationDiagnostic?.())return this.restorationMatchesHome(this.home.roleId)?this.startRestorePreview(this.home):this.startOwnedRole(this.home,{});
                await this.home.applyOwner({ kind: 'register-home', operationId: this.registrationId(OperationId(selection.registrationOperationId || selection.creationOperationId)), targetOperationId: OperationId(selection.registrationOperationId || selection.creationOperationId) });
                return this.startConnectedHome(this.home);
            }
            catch (error) {
                this.bootError = this.code(error);
                if (this.home) {
                    await this.home.close();
                    this.home = undefined;
                }
            }
        }
        const restoration=this.restorePointer();if(restoration){
            this.homePath=restoration.destination;this.diagnosticExpectedRoleId=restoration.expectedRoleId;
            const progress=await readRoleRestore(restoration.destination,{operationId:restoration.operationId,expectedRoleId:restoration.expectedRoleId});
            if(progress.phase==='awaiting-handover'||progress.phase==='accepted'){const opened=await openRoleHomeForRuntime(restoration.destination,{expectedRoleId:restoration.expectedRoleId});if('readSnapshot' in opened)this.home=opened;return 'readSnapshot'in opened?this.startRestorePreview(opened):this.startOwnedRole(opened,{});}
        }
        return this.startOwnedRole(undefined, {});
    }
    private qqProfile():QQProfileRecord{
        const raw=this.ctx.get('configEditor')?.entries().find(entry=>entry.options.name==='dsh-role-companion')?.options.config as Record<string,unknown>|undefined;
        if(raw?.qq!==undefined&&(!raw.qq||typeof raw.qq!=='object'||Array.isArray(raw.qq)||Object.getPrototypeOf(raw.qq)!==Object.prototype||Reflect.ownKeys(raw.qq).some(key=>typeof key!=='string'||!Object.hasOwn(qqProfileDefaults,key))))throw new HomeError('INVALID_QQ_PROFILE');
        const value=this.config.qq?.get()??qqProfileDefaults;
        if(!validateQQProfile(value))throw new HomeError('INVALID_QQ_PROFILE');
        return structuredClone(value);
    }
    private fileMappingProfile():FileMappingProfile{
        const raw=this.ctx.get('configEditor')?.entries().find(entry=>entry.options.name==='dsh-role-companion')?.options.config;
        const candidate=viewField(raw,'fileMappings');if(candidate!==undefined&&!validateFileMappings(candidate))throw new HomeError('INVALID_FILE_MAPPINGS');
        const value=this.config.fileMappings?.get()??fileMappingDefaults;if(!validateFileMappings(value))throw new HomeError('INVALID_FILE_MAPPINGS');const resolved=structuredClone(value);if(candidate!==undefined&&!Object.hasOwn(candidate,'protectionCacheId'))return {version:resolved.version,lastOperationId:resolved.lastOperationId,entries:resolved.entries};return resolved;
    }
    private async fileAccessView(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<FileAccessView>{
        const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),book=await role.owner.readFileAccess(),profile=this.fileMappingProfile(),root=this.home?.fileLayout?.root;
        const localMappings=[];for(const grant of book.value.grants){const mapping=profile.entries.find(entry=>entry.roleId===expectedRoleId&&entry.grantId===grant.grantId);localMappings.push({grantId:grant.grantId,path:mapping?.path??null,status:!mapping?'unbound' as const:profile.protectionCacheId&&fileProtectionCache(this.ctx).readyForAdmission&&root&&await mappingStillMatches(mapping,root,expectedRoleId)?'bound' as const:'stale' as const});}
        return {...book,roleId:expectedRoleId,bindingVersion:expectedBindingVersion,mappingVersion:profile.version,lastMappingOperationId:profile.lastOperationId,localMappings};
    }
    @Remote
    async readFileAccess(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<FileAccessView>{
        this.requireOwner('readFileAccess');return this.business(()=>this.exclusive(()=>this.fileAccessView(expectedRoleId,expectedBindingVersion)));
    }
    @Remote
    async editFileAccess(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:FileAccessEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('editFileAccess');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),raw=this.ctx.invocation?.request.args.request;if(!plainExact(raw,['operationId','value','expectedFileAccessVersion','expectedRevision']))throw new HomeError('INVALID_FILE_ACCESS');const command={...raw,kind:'edit-file-access'};if(!validateEditFileAccess(command))throw new HomeError('INVALID_FILE_ACCESS');return role.owner.apply(command);}));
    }
    @Remote
    async editFileMapping(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:FileMappingEditRequest):Promise<FileAccessView>{
        this.requireOwner('editFileMapping');return this.business(async()=>{
            const prepared=await this.exclusive(async()=>{
                const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),book=await role.owner.readFileAccess(),raw=this.ctx.invocation?.request.args.request;
                if(!plainExact(raw,['operationId','grantId','path','expectedFileMappingVersion','expectedFileAccessVersion'])||typeof raw.path!=='string'&&raw.path!==null)throw new HomeError('INVALID_FILE_MAPPING');
                OperationId(raw.operationId);const grantId=FileGrantId(raw.grantId);FileMappingVersion(raw.expectedFileMappingVersion);FileAccessVersion(raw.expectedFileAccessVersion);
                if(book.version!==request.expectedFileAccessVersion)throw new HomeError('FILE_ACCESS_VERSION_CONFLICT');if(!book.value.grants.some(grant=>grant.grantId===grantId))throw new HomeError('FILE_GRANT_UNAVAILABLE');
                const profile=this.fileMappingProfile(),prior=profile.entries.find(entry=>entry.roleId===expectedRoleId&&entry.grantId===grantId);
                if(profile.lastOperationId===request.operationId){if((prior?.path??null)!==raw.path)throw new HomeError('OPERATION_CONFLICT');return {view:await this.fileAccessView(expectedRoleId,expectedBindingVersion)};}
                if(profile.version!==request.expectedFileMappingVersion)throw new HomeError('FILE_MAPPING_VERSION_CONFLICT');
                const editor=this.ctx.get('configEditor');if(!editor)throw new HomeError('PROFILE_EDITOR_UNAVAILABLE');if(editor.entries().filter(entry=>entry.options.name==='dsh-role-companion').length!==1)throw new HomeError('PROFILE_ENTRY_AMBIGUOUS');
                if(!this.profileSelectsHome(expectedRoleId)||!this.home?.fileLayout)throw new HomeError('HOME_NOT_REGISTERED');if(this.qqRestart)throw new HomeError('PROFILE_RECONFIGURE_PENDING');
                const token={id:Symbol(),role,rolePromise:this.role,selection:this.selectionKey(),profile:JSON.stringify(profile),operationId:OperationId(raw.operationId)},homeRoot=this.home.fileLayout.root;
                this.qqRestart=token;return {token,path:raw.path,grantId,homeRoot};
            });
            if('view'in prepared)return prepared.view!;const {token,path,grantId,homeRoot}=prepared;
            try{
                // Directory metadata is obtained outside the owner control queue.
                const home=await localDirectoryIdentity(homeRoot),target=path===null?null:await localDirectoryIdentity(path);
                retainKnownFileHome(this.ctx,{...home,roleId:expectedRoleId,source:'opened-home'});const cache=await fileProtectionCache(this.ctx).snapshot(this.fileMappingProfile().protectionCacheId||undefined,knownFileHomes(this.ctx),true,{ownerReview:true});const mapping:LocalFileMapping|null=target?{grantId,roleId:expectedRoleId,homeRoot:home.root,homeFingerprint:home.fingerprint,path:target.root,pathFingerprint:target.fingerprint,operationId:token.operationId}:null;
                await this.exclusive(async()=>{if(this.qqRestart!==token||this.role!==token.rolePromise||this.selectionKey()!==token.selection||JSON.stringify(this.fileMappingProfile())!==token.profile)throw new HomeError('FILE_MAPPING_RESTART_CANCELLED');const book=await token.role.owner.readFileAccess();if(book.version!==request.expectedFileAccessVersion)throw new HomeError('FILE_ACCESS_VERSION_CONFLICT');token.role.lifetime.requestStop('migration');});
                await token.role.lifetime.stopped;
                return await this.exclusive(async()=>{
                    if(this.qqRestart!==token||this.role!==token.rolePromise||this.selectionKey()!==token.selection||JSON.stringify(this.fileMappingProfile())!==token.profile)throw new HomeError('FILE_MAPPING_RESTART_CANCELLED');
                    await this.qqEditContext.run(token.id,()=>editFileMappingProfile(this.ctx,()=>this.fileMappingProfile(),request,expectedRoleId,mapping,cache.cacheId));
                    if(this.qqRestart!==token||this.selectionKey()!==token.selection)throw new HomeError('FILE_MAPPING_RESTART_CANCELLED');this.home=undefined;this.bootError='';this.role=this.boot();await this.role;if(this.bootError)throw new HomeError(this.bootError);
                    return this.fileAccessView(expectedRoleId,expectedBindingVersion);
                });
            }finally{if(this.qqRestart===token)this.qqRestart=undefined;}
        });
    }
    private qqStatus():QQReceiveView{const view=this.qq?.inspect()??qqUnavailableView;return this.qqError?{...view,phase:'blocked',reason:this.qqError}:view;}
    private async startConnectedHome(home:OpenedRoleHome):Promise<RunningRole>{
        if(await home.readActivationDiagnostic?.())return this.restorationMatchesHome(home.roleId)?this.startRestorePreview(home):this.startOwnedRole(home,{});
        this.qqError='';
        let role!:RunningRole;
        this.qqBindingView=(await home.readSnapshot()).qqBinding??null;this.qqBindingVersion=this.qqBindingView?.version??0;
        const adapter=createQQReceiveAdapter({configuration:()=>qqTransportFields(this.qqProfile()),configurationVersion:()=>this.qqProfile().version,binding:async()=>{const binding=(await home.readSnapshot()).qqBinding??null;this.qqBindingView=binding;this.qqBindingVersion=binding?.version??0;return binding;},resolveCredential:async ref=>{const provider=this.ctx.get('credentials');return (await provider?.resolve(credentialRef(ref)))?.value;},receive:input=>role.runtime.receive(input)});
        role=await this.startOwnedRole(home,{execution:await this.nativeExecution(),inbound:adapter,delivery:adapter,history:adapter,files:createRoleFilePort(this.ctx,home,()=>this.fileMappingProfile())});this.qq=adapter;adapter.start();return role;
    }
    reconcileQQ():void{if(this.closing||this.qqRestart&&this.qqEditContext.getStore()===this.qqRestart.id)return;this.cancelQQRestart();void this.role.then(async()=>{if(!this.closing)await this.qq?.reconnect();}).catch(()=>{this.qqError='QQ_RECONFIGURE_FAILED';});}
    private async qqScope(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,operationId?:OperationId,writable=true){
        const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();
        if(writable&&(view.status==='stopping'||view.status==='stopped'))throw new HomeError('ROLE_STOPPING');
        if(expectedQQBindingVersion!==0)BindingVersion(expectedQQBindingVersion);
        if(!this.home)throw new HomeError('HOME_UNAVAILABLE');const binding=!writable&&(view.status==='stopping'||view.status==='stopped')?this.qqBindingView:(await this.home.readSnapshot()).qqBinding??null;this.qqBindingView=binding;this.qqBindingVersion=binding?.version??0;
        const old=operationId?await role.owner.readOperation(operationId):undefined;
        if(expectedQQBindingVersion!==this.qqBindingVersion&&!(old?.kind==='committed'&&old.committedRevision===binding?.activatedRevision))throw new HomeError('QQ_BINDING_CHANGED');
        return {role,binding};
    }
    private async qqView(roleId:RoleId,binding:QQBinding|null):Promise<QQConnectionView>{
        const profile=this.qqProfile(),provider=this.ctx.get('credentials');let credential:QQConnectionView['credential']={ref:profile.credentialRef,configured:false,writable:false,source:null};
        if(provider&&profile.credentialRef){const info=await provider.describe(credentialRef(profile.credentialRef));credential={ref:profile.credentialRef,configured:info.configured,writable:info.writable,source:info.source&&['env','file','project-env','user-env'].includes(info.source)?info.source:null};}
        return {homeRevision:this.home!.revision,roleId,bindingVersion:binding?.version??0,profileVersion:QQProfileVersion(profile.version),lastOperationId:profile.lastOperationId,value:qqTransportFields(profile),binding,transport:this.qqStatus(),credential};
    }
    @Remote
    async queryQQHistory(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:QQHistoryQueryRequest):Promise<QQHistoryQueryReceipt>{
        this.requireOwner('queryQQHistory');return this.business(async()=>{
            const captured=await this.exclusive(async()=>{const {role,binding}=await this.qqScope(expectedRoleId,expectedQQBindingVersion);const raw=this.ctx.invocation?.request.args.request;if(!plainExact(raw,['operationId']))throw new HomeError('INVALID_QQ_HISTORY_QUERY');return {role,binding,operationId:OperationId(raw.operationId)};});
            const query=await captured.role.owner.queryQQHistory({operationId:captured.operationId,...(captured.binding?{expectedBindingVersion:captured.binding.version}:{})});const receipt=await captured.role.owner.readOperation(captured.operationId);
            if(receipt.kind!=='committed'||receipt.committedRevision===undefined)throw new HomeError('IO_UNCERTAIN');return {roleId:expectedRoleId,queryId:query.queryId,operationId:query.operationId,committedRevision:receipt.committedRevision};
        });
    }
    @Remote
    async selectQQHistory(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:QQHistorySelectionRequest):Promise<QQHistorySelection>{
        this.requireOwner('selectQQHistory');return this.business(async()=>{
            const captured=await this.exclusive(async()=>{const {role,binding}=await this.qqScope(expectedRoleId,expectedQQBindingVersion);const raw=this.ctx.invocation?.request.args.request;if(!plainExact(raw,['operationId','queryId','candidateIds','acknowledgedGap','expectedRevision'])||!Array.isArray(raw.candidateIds)||raw.candidateIds.length<1||raw.candidateIds.length>200||new Set(raw.candidateIds).size!==raw.candidateIds.length||raw.acknowledgedGap!==true||!Number.isSafeInteger(raw.expectedRevision)||Number(raw.expectedRevision)<1)throw new HomeError('INVALID_QQ_HISTORY_SELECTION');if(!binding)throw new HomeError('QQ_NOT_BOUND');return {role,request:{operationId:OperationId(raw.operationId),queryId:QQHistoryQueryId(raw.queryId),candidateIds:raw.candidateIds.map(QQHistoryCandidateId),acknowledgedGap:true as const,expectedRevision:HomeRevision(raw.expectedRevision),expectedBindingVersion:binding.version}};});
            return captured.role.owner.selectQQHistory(captured.request);
        });
    }
    @Remote
    async readQQHistory(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request?:QQHistoryReadRequest):Promise<QQHistoryView>{
        this.requireOwner('readQQHistory');return this.business(()=>this.exclusive(async()=>{const {role,binding}=await this.qqScope(expectedRoleId,expectedQQBindingVersion,undefined,false),raw=this.ctx.invocation?.request.args.request;if(raw!==undefined&&!plainExact(raw,['queryId','operationId','queryOffset','candidateOffset','limit']))throw new HomeError('INVALID_QQ_HISTORY_PAGE');const state=await role.owner.readQQHistory();await this.qqScope(expectedRoleId,expectedQQBindingVersion,undefined,false);return qqHistoryView(state,expectedRoleId,binding,!!binding&&!!this.qq?.canRead(binding),request);}));
    }
    @Remote
    async readQQHistoryRecord(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:QQHistoryRecordRead):Promise<QQHistoryRecordPage>{
        this.requireOwner('readQQHistoryRecord');return this.business(()=>this.exclusive(async()=>{const {role}=await this.qqScope(expectedRoleId,expectedQQBindingVersion,undefined,false),raw=this.ctx.invocation?.request.args.request;if(!plainExact(raw,['kind','queryId','recordId','offset','limit']))throw new HomeError('INVALID_QQ_HISTORY_RECORD_PAGE');const state=await role.owner.readQQHistory();await this.qqScope(expectedRoleId,expectedQQBindingVersion,undefined,false);return qqHistoryRecord(state,request);}));
    }
    @Remote
    async readQQDeliveries(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,page?:ConversationPage):Promise<QQDeliveriesView>{
        this.requireOwner('readQQDeliveries');return this.business(()=>this.exclusive(async()=>{
            const {role,binding}=await this.qqScope(expectedRoleId,expectedQQBindingVersion),range=page??{offset:0,limit:20};if(!plainExact(range,['offset','limit'])||!Number.isSafeInteger(range.offset)||range.offset<0||!Number.isSafeInteger(range.limit)||range.limit<1||range.limit>20)throw new HomeError('INVALID_DELIVERY_PAGE');
            const state=await role.owner.readConversation();return {roleId:expectedRoleId,bindingVersion:binding?.version??0,revision:state.revision,rules:state.deliveryRules,offset:range.offset,limit:range.limit,total:state.deliveries.length,more:range.offset+range.limit<state.deliveries.length,deliveries:state.deliveries.slice(range.offset,range.offset+range.limit).map(d=>{const a=state.sendAttempts.find(a=>a.sendAttemptId===d.sendAttemptId),o=a?.observation;return {deliveryId:d.deliveryId,qualification:d.qualification,replyId:d.replyId??null,intentId:d.intentId??null,contactIntentId:d.contactIntentId??null,runId:d.runId,status:d.status,bindingVersion:d.target.version,codePoints:Array.from(d.text).length,committedRevision:d.committedRevision,retryOf:d.retryOf??null,supersedes:d.supersedes??null,supersededBy:d.supersededBy??null,sendAttemptId:d.sendAttemptId??null,messageId:o?.kind==='confirmed'?o.messageId:null,code:o&&'code'in o?o.code:'',blockedReason:d.status==='pending'?(d.target.version!==binding?.version?'QQ_BINDING_CHANGED':!restoreDeliveryEligible(this.home?.restoreAcceptanceSnapshot(),d,state)?'RESTORE_DELIVERY_REVIEW_REQUIRED':!this.qq?.canSend(d.target)?'QQ_OFFLINE':null):null};})};
        }));
    }
    @Remote
    async readQQDelivery(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:QQDeliveryRead):Promise<QQDeliveryPage>{
        this.requireOwner('readQQDelivery');return this.business(()=>this.exclusive(async()=>{const {role}=await this.qqScope(expectedRoleId,expectedQQBindingVersion);if(!plainExact(request,['deliveryId','offset','limit'])||!Number.isSafeInteger(request.offset)||request.offset<0||!Number.isSafeInteger(request.limit)||request.limit<1||request.limit>65536)throw new HomeError('INVALID_DELIVERY_PAGE');const state=await role.owner.readConversation(),delivery=state.deliveries.find(d=>d.deliveryId===DeliveryId(request.deliveryId));if(!delivery)throw new HomeError('DELIVERY_NOT_FOUND');const points=Array.from(delivery.text);return {revision:state.revision,rules:state.deliveryRules,resolutions:state.deliveryResolutions.filter(r=>r.deliveryId===delivery.deliveryId||r.newDeliveryId===delivery.deliveryId),delivery:{...delivery,text:points.slice(request.offset,request.offset+request.limit).join('')},attemptJSON:state.sendAttempts.some(a=>a.sendAttemptId===delivery.sendAttemptId)?JSON.stringify(state.sendAttempts.find(a=>a.sendAttemptId===delivery.sendAttemptId)):null,offset:request.offset,totalCodePoints:points.length,more:request.offset+request.limit<points.length};}));
    }
    @Remote
    async readQQExecutionRecord(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion,request:ExecutionRecordRead):Promise<OwnerExecutionRecordPage>{
        this.requireOwner('readQQExecutionRecord');return this.business(()=>this.exclusive(async()=>{const {role,binding}=await this.qqScope(expectedRoleId,expectedQQBindingVersion);if(!binding)throw new HomeError('QQ_NOT_BOUND');const state=await role.owner.readConversation(),candidate=request.kind==='attempt'?state.attempts.find(a=>a.attemptId===request.recordId):state.nativeRecords.find(n=>n.provenance+'/'+n.nativeId===request.recordId),turn=candidate&&state.turns.find(t=>t.runId===candidate.runId);if(!candidate||!turn||turn.bindingId!==binding.bindingId||turn.bindingVersion!==binding.version)throw new HomeError('QQ_BINDING_CHANGED');return readStableExecutionRecord(role.owner,request,(current,page)=>{const latest=current.turns.find(t=>t.runId===page.runId);if(!latest||latest.bindingId!==binding.bindingId||latest.bindingVersion!==binding.version)throw new HomeError('QQ_BINDING_CHANGED');});}));
    }
    @Remote
    async readQQReply(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:ReplyRead):Promise<ReplyPage>{
        this.requireOwner('readQQReply');return this.business(()=>this.exclusive(async()=>{const {role}=await this.qqScope(expectedRoleId,expectedQQBindingVersion);if(!plainExact(request,['replyId','offset','limit']))throw new HomeError('INVALID_REPLY_PAGE');const reply=await role.owner.readReply(request);if(reply.bindingId!=='qq-'+expectedRoleId)throw new HomeError('BINDING_CHANGED');return reply;}));
    }
    @Remote
    async resolveQQDelivery(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:QQDeliveryResolutionRequest):Promise<OwnerReceipt>{
        this.requireOwner('resolveQQDelivery');return this.business(()=>this.exclusive(async()=>{const {role}=await this.qqScope(expectedRoleId,expectedQQBindingVersion);const raw=this.ctx.invocation?.request.args.request;
            if(!plainExact(raw,['operationId','deliveryId','sendAttemptId','decision','note','duplicateRiskAcknowledged','expectedRevision','expectedDeliveryRulesVersion']))throw new HomeError('INVALID_DELIVERY_RESOLUTION');
            const command={...raw,kind:'resolve-delivery' as const,expectedQQBindingVersion};if(!validateResolveDelivery(command))throw new HomeError('INVALID_DELIVERY_RESOLUTION');return role.owner.apply(command);
        }));
    }
    @Remote
    async editQQDeliveryRules(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:QQDeliveryRulesEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('editQQDeliveryRules');return this.business(()=>this.exclusive(async()=>{const {role}=await this.qqScope(expectedRoleId,expectedQQBindingVersion);const raw=this.ctx.invocation?.request.args.request;if(!plainExact(raw,['operationId','expectedRevision','expectedDeliveryRulesVersion','value'])||!validateDeliveryRules(raw.value))throw new HomeError('INVALID_DELIVERY_RULES');return role.owner.apply({kind:'edit-delivery-rules',operationId:OperationId(raw.operationId),expectedRevision:request.expectedRevision,expectedDeliveryRulesVersion:request.expectedDeliveryRulesVersion,value:raw.value});}));
    }
    @Remote
    async readQQ(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0):Promise<QQConnectionView>{
        this.requireOwner('readQQ');return this.business(()=>this.exclusive(async()=>{const {binding}=await this.qqScope(expectedRoleId,expectedQQBindingVersion,undefined,false);return this.qqView(expectedRoleId,binding);}));
    }
    @Remote
    async editQQConnection(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:QQConnectionEditRequest):Promise<QQConnectionView>{
        this.requireOwner('editQQConnection');return this.business(async()=>{
            const prepared=await this.exclusive(async()=>{
                const {role,binding}=await this.qqScope(expectedRoleId,expectedQQBindingVersion);
                if(!plainExact(this.ctx.invocation?.request.args.request,['operationId','expectedProfileVersion','value']))throw new HomeError('INVALID_QQ_TRANSPORT');
                const value=this.configurationValue('request','value'),profile=this.qqProfile(),restoredConnectionId=this.restorationMatchesHome(expectedRoleId)?binding?.connectionId:undefined;prepareQQProfile(profile,request,value,restoredConnectionId);
                const editor=this.ctx.get('configEditor');if(!editor)throw new HomeError('PROFILE_EDITOR_UNAVAILABLE');if(editor.entries().filter(entry=>entry.options.name==='dsh-role-companion').length!==1)throw new HomeError('PROFILE_ENTRY_AMBIGUOUS');
                if(!this.profileSelectsHome(expectedRoleId)&&!restoredConnectionId)throw new HomeError('HOME_NOT_REGISTERED');
                if(profile.lastOperationId===request.operationId)return {view:await this.qqView(expectedRoleId,binding)};
                if(this.qqRestart)throw new HomeError('QQ_RECONFIGURE_PENDING');
                const token={id:Symbol(),role,rolePromise:this.role,selection:this.selectionKey(),profile:JSON.stringify(profile),operationId:OperationId(request.operationId)};
                this.qqRestart=token;role.lifetime.requestStop('migration');return {token,value,restoredConnectionId};
            });
            if('view' in prepared)return prepared.view!;
            const {token,value,restoredConnectionId}=prepared;
            try{
                // The original writer, records, Native observers and protocol finish outside the control queue.
                await token.role.lifetime.stopped;
                return await this.exclusive(async()=>{
                    if(this.qqRestart!==token||this.role!==token.rolePromise||this.selectionKey()!==token.selection||JSON.stringify(this.qqProfile())!==token.profile)throw new HomeError('QQ_RESTART_CANCELLED');
                    const view=await token.role.runtime.inspect();
                    if('backups' in view&&Array.isArray(view.backups)&&view.backups.some((item:unknown)=>viewField(item,'checkpoint')!=='verified'))throw new HomeError('MAINTENANCE_PENDING');
                    await this.qqEditContext.run(token.id,()=>editQQProfile(this.ctx,()=>this.qqProfile(),request,value,restoredConnectionId));
                    if(this.qqRestart!==token||this.selectionKey()!==token.selection||this.qqProfile().lastOperationId!==token.operationId)throw new HomeError('QQ_RESTART_CANCELLED');
                    this.home=undefined;this.bootError='';this.role=this.boot();await this.role;
                    if(this.bootError)throw new HomeError(this.bootError);
                    const opened=this.home as OpenedRoleHome|undefined;const binding=opened?(await opened.readSnapshot()).qqBinding??null:null;
                    return this.qqView(expectedRoleId,binding);
                });
            }finally{if(this.qqRestart===token)this.qqRestart=undefined;}
        });
    }
    @Remote
    async bindQQ(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0,request:QQBindingEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('bindQQ');return this.business(()=>this.exclusive(async()=>{
            const {role,binding}=await this.qqScope(expectedRoleId,expectedQQBindingVersion,OperationId(request.operationId));
            if(!plainExact(this.ctx.invocation?.request.args.request,['operationId','accountId','peerId','expectedRevision','replaceConfirmed'])||typeof request.replaceConfirmed!=='boolean')throw new HomeError('INVALID_QQ_BINDING');
            const old=await role.owner.readOperation(request.operationId);if(binding&&old.kind==='not-found'&&!request.replaceConfirmed)throw new HomeError('QQ_REPLACE_CONFIRMATION_REQUIRED');
            const profile=this.qqProfile();if(!profile.connectionId)throw new HomeError('QQ_CONNECTION_NOT_CONFIGURED');
            const result=await role.owner.apply({kind:'bind-qq',operationId:OperationId(request.operationId),connectionId:QQConnectionId(profile.connectionId),accountId:QQAccountId(request.accountId),peerId:QQPeerId(request.peerId),expectedBindingVersion:expectedQQBindingVersion,expectedRevision:request.expectedRevision});
            this.qqBindingView=(await this.home!.readSnapshot()).qqBinding??null;this.qqBindingVersion=this.qqBindingView?.version??0;if(old.kind!=='committed')this.reconcileQQ();return result;
        }));
    }
    @Remote
    async recheckQQ(expectedRoleId:RoleId,expectedQQBindingVersion:BindingVersion|0):Promise<QQReceiveView>{
        this.requireOwner('recheckQQ');return this.business(()=>this.exclusive(async()=>{await this.qqScope(expectedRoleId,expectedQQBindingVersion);this.reconcileQQ();return this.qqStatus();}));
    }
    private code(error: unknown) { return error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : error instanceof Error && error.message.includes('overridden by a home patch or command-line overlay') ? 'PROFILE_OVERLAY_CONFLICT' : safeExecutionCode(error)==='EXECUTION_FAILED'?'PROFILE_REGISTRATION_FAILED':safeExecutionCode(error); }
    private async business<T>(run: () => Promise<T>): Promise<T> { try {
        return await run();
    }
    catch (error) {
        throw new RemoteError('role/home-error', '角色之家操作未完成。请核对原操作结果。', { reason: this.code(error) });
    } }
    /** Public Gateway provenance retains the original JSON before compatible codecs strip keys. */
    private configurationValue(argument: 'request' | 'command', field: string): unknown {
        const raw = this.ctx.invocation?.request.args[argument];
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
        const descriptor = Object.getOwnPropertyDescriptor(raw, field);
        return descriptor && 'value' in descriptor ? descriptor.value : undefined;
    }
    private registrationId(operationId: OperationId) { return OperationId('registration-' + createHash('sha256').update(operationId).digest('hex')); }
    private exclusive<T>(run: () => Promise<T>): Promise<T> { const task = this.serial.then(() => { if (this.closing)
        throw new HomeError('ROLE_STOPPING'); return run(); }); this.serial = task.catch(() => { }); return task; }
    private async register(operationId: OperationId, expectedVersion: ProfileSelectionVersion,restoreAcceptanceOperationId?:OperationId): Promise<HomeConnectReceipt> {
        const role = await this.role;
        const view = await this.home!.readSnapshot();
        try {
            const activation=await this.home!.readActivationDiagnostic?.();if(activation)throw new HomeError(activation.reason);
            const editor = this.ctx.get('configEditor');
            if (!editor)
                throw new HomeError('PROFILE_EDITOR_UNAVAILABLE');
            const entries = editor.entries().filter(entry => entry.options.name === 'dsh-role-companion');
            if (entries.length !== 1)
                throw new HomeError('PROFILE_ENTRY_AMBIGUOUS');
            const desired = { path: this.homePath, roleId: view.roleId, creationOperationId: view.creationOperationId, registrationOperationId: operationId };
            const profile=this.fileMappingProfile(),selection=this.config.bootstrap.get();let protectionCacheId=profile.protectionCacheId;
            if(!protectionCacheId&&this.ctx.get('profileContext')){const identity=await localDirectoryIdentity(this.home!.fileLayout!.root);retainKnownFileHome(this.ctx,{...identity,roleId:view.roleId,source:'opened-home'});const firstSelection=selection.version===0&&!selection.path&&!selection.roleId;try{const cache=await fileProtectionCache(this.ctx).snapshot(undefined,knownFileHomes(this.ctx),firstSelection,{firstSelection,ownerReview:true,admission:firstSelection});protectionCacheId=cache.cacheId;}catch(error){if(safeExecutionCode(error)!=='FILE_PROTECTION_UNPROVEN')throw error;}}
            const withProtection=(current:Record<string,unknown>)=>{if(JSON.stringify(this.fileMappingProfile())!==JSON.stringify(profile))throw new HomeError('FILE_MAPPING_VERSION_CONFLICT');return protectionCacheId?{...current,fileMappings:{...profile,protectionCacheId}}:current;};
            await withFileProfileEdit(this.ctx,()=>editor.edit(entries[0]!, current => { const old = current.bootstrap as BootstrapSelection | undefined; const currentVersion = old?.version ?? 0; if (old?.path === desired.path && old.roleId === desired.roleId && old.creationOperationId === desired.creationOperationId && old.registrationOperationId === desired.registrationOperationId)
                return withProtection(current); if (currentVersion !== expectedVersion)
                throw new HomeError('PROFILE_VERSION_CONFLICT'); return withProtection({ ...current, bootstrap: { ...desired, version: ProfileSelectionVersion(currentVersion + 1) } }); }));
            const applied = this.config.bootstrap.get();
            if (applied.path !== desired.path || applied.roleId !== desired.roleId || protectionCacheId&&this.fileMappingProfile().protectionCacheId!==protectionCacheId)
                throw new HomeError('PROFILE_APPLY_UNCONFIRMED');
            if(restoreAcceptanceOperationId)await role.owner.completeRestoreRegistration({acceptanceOperationId:restoreAcceptanceOperationId,stage:'register'});else await role.owner.apply({ kind: 'register-home', operationId: this.registrationId(operationId), targetOperationId: operationId });
            const result = await role.owner.readOperation(operationId);
            return { operationId, roleId: view.roleId, committedRevision: result.committedRevision ?? view.revision, registration: 'registered' };
        }
        catch (error) {
            return { operationId, roleId: view.roleId, committedRevision: view.revision, registration: error instanceof HomeError && ['IO_UNCERTAIN', 'PROFILE_APPLY_UNCONFIRMED'].includes(error.code) ? 'uncertain' : 'unregistered', errorCode: this.code(error) };
        }
    }
    private async activateRegisteredHome(){
        const current=await this.role;if((await current.runtime.inspect()).status==='ready')return;
        current.lifetime.requestStop('migration');await current.lifetime.stopped;
        this.home=undefined;this.bootError='';this.role=this.boot();await this.role;
    }
    @Remote
    async requestHandover(expectedRoleId:RoleId,request:HandoverRequest):Promise<HandoverProgress>{
        this.requireOwner('requestHandover');return this.business(async()=>{const raw=this.ctx.invocation?.request.args.request;if(!validateHandoverRequest(raw))throw new HomeError('INVALID_HANDOVER');const role=await this.exclusive(()=>this.expectedRole(expectedRoleId));return role.owner.requestHandover({...raw});});
    }
    @Remote
    async readHandover(expectedRoleId:RoleId,operationId:OperationId):Promise<HandoverProgress>{
        this.requireOwner('readHandover');return this.business(async()=>{const role=await this.exclusive(()=>this.expectedRole(expectedRoleId));return role.owner.readHandover(OperationId(operationId));});
    }
    private async reserveRestoreProfile(request:RestoreRequest,expectedVersion:ProfileSelectionVersion){
        const prior=this.restorePointer();if(prior){if(!sameRestoreRequest(prior,request)||prior.requestedProfileVersion!==expectedVersion)throw new HomeError('OPERATION_CONFLICT');return;}
        const selection=this.config.bootstrap.get();if(selection.path||selection.roleId||selection.version!==expectedVersion||expectedVersion!==0)throw new HomeError('PROFILE_VERSION_CONFLICT');
        const editor=this.ctx.get('configEditor');if(!editor)throw new HomeError('PROFILE_EDITOR_UNAVAILABLE');const owners=editor.entries().filter(entry=>entry.options.name==='dsh-role-companion');if(owners.length!==1)throw new HomeError('PROFILE_ENTRY_AMBIGUOUS');
        const profile=this.fileMappingProfile();let protectionCacheId=profile.protectionCacheId;
        if(!protectionCacheId&&this.ctx.get('profileContext')){const cache=await fileProtectionCache(this.ctx).snapshot(undefined,knownFileHomes(this.ctx),true,{firstSelection:true,ownerReview:true,admission:true});protectionCacheId=cache.cacheId;}
        const pointer={...request,requestedProfileVersion:expectedVersion};
        await withFileProfileEdit(this.ctx,()=>editor.edit(owners[0]!,current=>{
            if(this.config.bootstrap.get().version!==expectedVersion||this.restorePointer())throw new HomeError('PROFILE_VERSION_CONFLICT');
            if(JSON.stringify(this.fileMappingProfile())!==JSON.stringify(profile))throw new HomeError('FILE_MAPPING_VERSION_CONFLICT');
            return {...current,restoration:pointer,bootstrap:{...selection,version:ProfileSelectionVersion(expectedVersion+1)},fileMappings:{...profile,protectionCacheId}};
        }));const applied=this.restorePointer();if(!applied||!sameRestoreRequest(applied,request)||this.config.bootstrap.get().version!==expectedVersion+1)throw new HomeError('PROFILE_APPLY_UNCONFIRMED');
    }
    @Remote
    async requestRestore(request:RestoreRequest,expectedProfileVersion:ProfileSelectionVersion):Promise<RestoreProgress>{
        this.requireOwner('requestRestore');const raw=this.ctx.invocation?.request.args.request;
        return this.business(async()=>{
            if(!validateRestoreRequest(raw))throw new HomeError('INVALID_RESTORE_REQUEST');ProfileSelectionVersion(expectedProfileVersion);
            const admitted={...raw},prior=this.restoreCall;
            if(prior){if(!sameRestoreRequest(prior.request,admitted))throw new HomeError('OPERATION_CONFLICT');return prior.task;}
            const begin=await this.exclusive(async()=>{
                const current=await this.role,view=await current.runtime.inspect();if(this.home&&view.status!=='read-only')throw new HomeError('HOME_ALREADY_OPEN');
                const pointer=this.restorePointer();if(pointer){if(!sameRestoreRequest(pointer,admitted)||pointer.requestedProfileVersion!==expectedProfileVersion)throw new HomeError('OPERATION_CONFLICT');const saved=await current.owner.readRestore(admitted.destination,{operationId:admitted.operationId,expectedRoleId:admitted.expectedRoleId});if(saved.phase==='awaiting-handover'||saved.phase==='accepted')return {current,saved};}
                this.restoreSelecting=true;try{await this.reserveRestoreProfile(admitted,expectedProfileVersion);return {current,task:current.owner.requestRestore(admitted)};}catch(error){this.restoreSelecting=false;throw error;}
            });
            if(begin.saved)return begin.saved;
            const task=(async()=>{try{const progress=await begin.task!;
                if(progress.phase==='awaiting-handover'&&!this.closing)await this.exclusive(async()=>{begin.current.lifetime.requestStop('migration');await begin.current.lifetime.stopped;if(this.closing)return;this.home=undefined;this.homePath=admitted.destination;this.diagnosticExpectedRoleId=admitted.expectedRoleId;this.bootError='';const opened=await openRoleHomeForRuntime(admitted.destination,{expectedRoleId:admitted.expectedRoleId});if('readSnapshot' in opened)this.home=opened;this.role='readSnapshot'in opened?this.startRestorePreview(opened):this.startOwnedRole(opened,{});await this.role;});return progress;
            }finally{this.restoreSelecting=false;}})();
            this.restoreCall={request:admitted,task};const clear=()=>{if(this.restoreCall?.task===task)this.restoreCall=undefined;};void task.then(clear,clear);return task;
        });
    }
    @Remote
    async confirmRestore(expectedRoleId:RoleId,request:RestoreConfirmation,expectedRestoreProfileVersion:ProfileSelectionVersion):Promise<HomeConnectReceipt>{
        this.requireOwner('confirmRestore');const raw=this.ctx.invocation?.request.args.request;
        return this.business(async()=>{
            const admitted=restoreConfirmation(raw);ProfileSelectionVersion(expectedRestoreProfileVersion);
            const prepared=await this.exclusive(async()=>{
                const pointer=this.restorePointer();if(!pointer||pointer.expectedRoleId!==expectedRoleId||pointer.operationId!==admitted.restoreOperationId||pointer.expectedManifestDigest!==admitted.expectedManifestDigest)throw new HomeError('RESTORE_IDENTITY_CONFLICT');
                if(pointer.requestedProfileVersion!==expectedRestoreProfileVersion)throw new HomeError('PROFILE_VERSION_CONFLICT');
                const role=await this.expectedRole(expectedRoleId),target=this.home;if(!target)throw new HomeError('HOME_UNAVAILABLE');
                const selected=this.config.bootstrap.get(),ids=restoreRegistrationIds(admitted.operationId),existing=target.restoreAcceptanceSnapshot();
                const registered=selected.path===pointer.destination&&selected.roleId===expectedRoleId&&selected.registrationOperationId===ids.attachOperationId&&target.operationSnapshot(ids.registrationOperationId).kind==='committed';
                if(registered&&existing?.operationId===admitted.operationId){const accepted=await role.owner.confirmRestore(admitted);return {role,target,pointer,registered:{operationId:admitted.operationId,roleId:expectedRoleId,committedRevision:accepted.committedRevision,registration:'registered' as const}};}
                const reservedVersion=ProfileSelectionVersion(expectedRestoreProfileVersion+1);
                if(selected.version!==reservedVersion&&!(selected.path===pointer.destination&&selected.roleId===expectedRoleId&&selected.registrationOperationId===ids.attachOperationId))throw new HomeError('PROFILE_VERSION_CONFLICT');
                const binding=(await target.readSnapshot()).qqBinding;if(binding&&!this.qq?.canRead(binding))throw new HomeError('RESTORE_QQ_VERIFICATION_REQUIRED');
                const uncertain=(await target.readSnapshot()).uncertainOperationId;
                if(uncertain===ids.attachOperationId)await role.owner.completeRestoreRegistration({acceptanceOperationId:admitted.operationId,stage:'attach'});
                else if(uncertain===ids.registrationOperationId)await role.owner.completeRestoreRegistration({acceptanceOperationId:admitted.operationId,stage:'register'});
                this.restoreSelecting=true;return {role,target,pointer,reservedVersion};
            });
            if(prepared.registered)return prepared.registered;
            try{
                await retainRestoreFileProtection(this.ctx,prepared.pointer,this.fileMappingProfile());
                const accepted=await prepared.role.owner.confirmRestore(admitted);
                return await this.exclusive(async()=>{
                    const pointer=this.restorePointer();if(this.home!==prepared.target||await this.role!==prepared.role||!pointer||!sameRestoreRequest(pointer,prepared.pointer))throw new HomeError('ROLE_CHANGED');
                    const binding=(await prepared.target.readSnapshot()).qqBinding;if(binding&&!this.qq?.canRead(binding))throw new HomeError('RESTORE_QQ_VERIFICATION_REQUIRED');
                    await prepared.role.owner.completeRestoreRegistration({acceptanceOperationId:admitted.operationId,stage:'attach'});
                    const receipt=await this.register(restoreRegistrationIds(admitted.operationId).attachOperationId,prepared.reservedVersion!,admitted.operationId);
                    if(receipt.registration==='registered')await this.activateRegisteredHome();
                    return {...receipt,operationId:admitted.operationId,committedRevision:accepted.committedRevision};
                });
            }finally{this.restoreSelecting=false;}
        });
    }
    @Remote
    async readRestore(destination:string,request:RestoreRead):Promise<RestoreProgress>{
        this.requireOwner('readRestore');return this.business(async()=>{
            if(!plainExact(this.ctx.invocation?.request.args.request,['operationId','expectedRoleId']))throw new HomeError('INVALID_RESTORE_READ');OperationId(request.operationId);RoleId(request.expectedRoleId);
            const pointer=this.restorePointer();if(pointer&&(pointer.operationId!==request.operationId||pointer.destination!==destination||pointer.expectedRoleId!==request.expectedRoleId))throw new HomeError('RESTORE_IDENTITY_CONFLICT');
            const result=await (await this.role).owner.readRestore(destination,request);return result.phase==='not-found'&&pointer?{...result,backupPath:pointer.backupPath,manifestDigest:pointer.expectedManifestDigest,phase:'uncertain',error:'RESTORE_RECONCILIATION_REQUIRED'}:result;
        });
    }
    @Remote
    async createHome(path: string, request: CreateHomeInput, expectedProfileVersion: ProfileSelectionVersion): Promise<HomeConnectReceipt> {
        this.requireOwner('createHome');
        return this.business(() => this.exclusive(async () => {
            ProfileSelectionVersion(expectedProfileVersion);if(this.restorePointer())throw new HomeError('RESTORE_PENDING');
            const value=this.configurationValue('request','settings');if(!validateInputSettings(value))throw new HomeError('INVALID_SETTINGS');
            const admitted:CreateHomeRequest={...request,operationId:OperationId(request.operationId),settings:value};
            await this.role;
            if (this.home) {
                if (path !== this.homePath)
                    throw new HomeError('HOME_ALREADY_OPEN');
                await (await this.role).owner.apply({ kind: 'create', ...admitted });
            }
            else {
                this.home = await createRoleHome(path, admitted);
                this.homePath = path;
                this.role = this.startOwnedRole(this.home, {});
                this.bootError = '';
            }
            const receipt=await this.register(request.operationId, expectedProfileVersion);if(receipt.registration==='registered')await this.activateRegisteredHome();return receipt;
        }));
    }
    @Remote
    async attachHome(path: string, expectedRoleId: RoleId, operationId: OperationId, expectedProfileVersion: ProfileSelectionVersion): Promise<HomeConnectReceipt> {
        this.requireOwner('attachHome');
        return this.business(() => this.exclusive(async () => {
            RoleId(expectedRoleId);OperationId(operationId);ProfileSelectionVersion(expectedProfileVersion);if(this.restorePointer())throw new HomeError('RESTORE_PENDING');
            await this.role;
            if (this.home) {
                if (path !== this.homePath || this.home.roleId !== expectedRoleId)
                    throw new HomeError('HOME_ALREADY_OPEN');
            }
            else {
                const opened = await openRoleHomeForRuntime(path, { expectedRoleId });
                if (!('readSnapshot' in opened)) {
                    this.homePath = path; this.diagnosticExpectedRoleId = expectedRoleId; this.role = this.startOwnedRole(opened, {});
                    throw new HomeError((await opened.readDiagnostic()).reason);
                }
                this.home = opened;
                this.homePath = path;
                this.role = this.startOwnedRole(this.home, {});
                this.bootError = '';
            }
            await (await this.role).owner.apply({ kind: 'attach-home', operationId, roleId: expectedRoleId });
            const receipt=await this.register(operationId, expectedProfileVersion);if(receipt.registration==='registered')await this.activateRegisteredHome();return receipt;
        }));
    }
    @Remote
    async applyOwner(command: OwnerEditInput, expectedRoleId: RoleId): Promise<OwnerReceipt> {
        this.requireOwner('applyOwner');
        return this.business(() => this.exclusive(async () => { if (command.kind !== 'edit-core' && command.kind !== 'edit-settings')
            throw new HomeError('UNSUPPORTED_OWNER_COMMAND');
            const role=await this.expectedRole(expectedRoleId);
            if(command.kind==='edit-settings'){const value=this.configurationValue('command','settings');if(!validateInputSettings(value))throw new HomeError('INVALID_SETTINGS');return role.owner.apply({...command,settings:value});}
            return role.owner.apply(command); }));
    }
    @Remote
    async readOperation(operationId: OperationId, expectedRoleId: RoleId): Promise<HomeOperation> {
        this.requireOwner('readOperation');
        return this.business(() => this.exclusive(async () => (await this.expectedRole(expectedRoleId)).owner.readOperation(operationId)));
    }
    /** Cancel only a live maintenance intent; old completed receipts do not affect a new Host lifetime. */
    private backupRole(expectedRoleId:RoleId,operationId:OperationId):Promise<RunningRole>{
        return this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),prior=await role.owner.readBackup(operationId);
            if(prior.checkpoint!=='verified'&&'cancelQQRestart' in this&&typeof this.cancelQQRestart==='function')this.cancelQQRestart();
            return role;
        });
    }
    @Remote
    async requestBackup(expectedRoleId:RoleId,request:BackupRequest):Promise<BackupProgress>{
        this.requireOwner('requestBackup');return this.business(async()=>{const role=await this.backupRole(expectedRoleId,OperationId(request.operationId));return role.owner.requestBackup(request);});
    }
    @Remote
    async readBackup(expectedRoleId:RoleId,operationId:OperationId):Promise<BackupProgress>{
        this.requireOwner('readBackup');return this.business(async()=>{const role=await this.exclusive(()=>this.expectedRole(expectedRoleId));return role.owner.readBackup(OperationId(operationId));});
    }
    @Remote
    async resumeBackup(expectedRoleId:RoleId,request:BackupRequest):Promise<BackupProgress>{
        this.requireOwner('resumeBackup');return this.business(async()=>{const role=await this.backupRole(expectedRoleId,OperationId(request.operationId));return role.owner.resumeBackup(request);});
    }
    @Remote
    async verifyBackup(expectedRoleId:RoleId,operationId:OperationId):Promise<BackupProgress>{
        this.requireOwner('verifyBackup');return this.business(async()=>{const role=await this.exclusive(()=>this.expectedRole(expectedRoleId));return role.owner.verifyBackup(OperationId(operationId));});
    }
    @Remote
    async previewFormatUpgrade(expectedRoleId:RoleId):Promise<FormatUpgradePreview>{
        this.requireOwner('previewFormatUpgrade');return this.business(async()=>{const role=await this.exclusive(()=>this.expectedRole(expectedRoleId));return role.owner.previewFormatUpgrade();});
    }
    @Remote
    async requestFormatUpgrade(expectedRoleId:RoleId,request:FormatUpgradeRequest):Promise<FormatUpgradeProgress>{
        this.requireOwner('requestFormatUpgrade');return this.business(async()=>{const role=await this.exclusive(()=>this.expectedRole(expectedRoleId));return role.owner.requestFormatUpgrade({operationId:OperationId(request.operationId),expectedRevision:HomeRevision(request.expectedRevision)});});
    }
    @Remote
    async readFormatUpgrade(expectedRoleId:RoleId,operationId:OperationId):Promise<FormatUpgradeProgress|{readonly operationId:OperationId;readonly phase:'not-found'}>{
        this.requireOwner('readFormatUpgrade');return this.business(async()=>{const role=await this.exclusive(()=>this.expectedRole(expectedRoleId));return role.owner.readFormatUpgrade(OperationId(operationId));});
    }
    @Remote
    async resumeFormatUpgrade(expectedRoleId:RoleId,request:FormatUpgradeRequest):Promise<FormatUpgradeProgress>{
        this.requireOwner('resumeFormatUpgrade');return this.business(async()=>{const role=await this.exclusive(()=>this.expectedRole(expectedRoleId));return role.owner.resumeFormatUpgrade({operationId:OperationId(request.operationId),expectedRevision:HomeRevision(request.expectedRevision)});});
    }
    @Remote
    async stopRole(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:StopRequest):Promise<HomeOperation>{
        this.requireOwner('stopRole');return this.business(async()=>{const role=await this.exclusive(async()=>{const current=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),old=await current.owner.readOperation(request.operationId);if(old.stop?.phase!=='unverified')this.cancelQQRestart();return current;});return role.owner.stop(request);});
    }
    @Remote
    async readStopOperation(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,operationId:OperationId):Promise<HomeOperation>{
        this.requireOwner('readStopOperation');return this.business(async()=>{const role=await this.exclusive(()=>this.expectedBoundRole(expectedRoleId,expectedBindingVersion));return role.owner.readOperation(OperationId(operationId));});
    }
    @Remote
    async reopenRole(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,stopOperationId:OperationId):Promise<RoleView>{
        this.requireOwner('reopenRole');return this.business(()=>this.exclusive(async()=>{
            OperationId(stopOperationId);const previous=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),operation=await previous.owner.readOperation(stopOperationId),view=await previous.runtime.inspect();
            if(!operation.stop||operation.stop.reason!=='owner-stop')throw new HomeError('STOP_NOT_COMPLETED');
            // An already reconciled request is an idempotent retry, never permission to replace a new stack.
            if(operation.stop.reconciledRevision!==undefined)return view;
            if(operation.stop.phase!=='stopped'||view.status!=='stopped'||view.stop?.operationId!==stopOperationId)throw new HomeError('STOP_NOT_COMPLETED');
            await previous.lifetime.stopped;
            const opened=await openRoleHomeForRuntime(this.homePath,{expectedRoleId});
            this.home=undefined;if('readSnapshot' in opened)this.home=opened;
            const registered=this.profileSelectsHome(expectedRoleId);
            this.role=this.home&&registered?this.startConnectedHome(this.home):this.startOwnedRole(opened,{});
            return (await this.role).runtime.inspect();
        }));
    }
    private async expectedBoundRole(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<RunningRole>{
        const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();BindingVersion(expectedBindingVersion);if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return role;
    }
    private async expectedRole(expectedRoleId: RoleId): Promise<RunningRole> {
        const role = await this.role;
        await role.runtime.inspect();
        if (!expectedRoleId || this.selectedRoleId() !== expectedRoleId) throw new HomeError('ROLE_CHANGED');
        RoleId(expectedRoleId);
        return role;
    }
    @Remote
    async submitInput(request: PanelInputRequest): Promise<InputReceipt> {
        this.requireOwner('submitInput');
        return this.business(() => this.exclusive(async () => {
            const role = await this.role;
            const view = await role.runtime.inspect();
            const binding = view.home?.panelBinding;
            if (!request.expectedRoleId || request.expectedRoleId !== view.roleId) return { kind: 'rejected', operationId: request.operationId, reason: 'role-changed' };
            if (!binding) return { kind: 'rejected', operationId: request.operationId, reason: 'not-ready' };
            if (request.expectedBindingVersion !== binding.bindingVersion) return { kind: 'rejected', operationId: request.operationId, reason: 'not-bound' };
            return role.runtime.receive({ operationId: request.operationId, externalKey: request.clientRequestId, text: request.text, bindingId: binding.bindingId, bindingVersion: binding.bindingVersion, origin: 'live', receivedAt: new Date().toISOString(), sourceEvidence: 'authenticated-owner-panel',...(request.contextPurpose?{contextPurpose:request.contextPurpose}:{}) });
        }));
    }
    @Remote
    async readInputs(expectedRoleId: RoleId, page?: InputPageRequest): Promise<InputListView> {
        this.requireOwner('readInputs');
        return this.business(() => this.exclusive(async () => {
            const range = page ?? { afterSequence: 0, limit: 4 };
            if (!Number.isSafeInteger(range.afterSequence) || range.afterSequence < 0 || !Number.isSafeInteger(range.limit) || range.limit < 1 || range.limit > 4) throw new HomeError('INVALID_INPUT_PAGE');
            const view = await (await this.expectedRole(expectedRoleId)).runtime.inspect();
            const snapshot = view.home && this.home ? await this.home.readSnapshot() : undefined;
            const all = snapshot?.inputs ?? [];
            const inputs = all.filter(x => x.receiveSequence > range.afterSequence).slice(0, range.limit).map(input=>{
                if(input.channel!=='qq'||input.status==='blocked')return input;
                // Legacy receipt-time availability is retained in Home, not presented as current readiness.
                const {processingUnavailableReason,...record}=input;if(input.status!=='queued'&&input.status!=='running')return record;
                const binding=snapshot?.qqBinding;if(!binding||input.bindingId!==binding.bindingId||input.bindingVersion!==binding.version)return {...record,blockedReason:'binding-changed'};
                if(!this.qq?.canSend(binding))return {...record,blockedReason:'QQ_OFFLINE'};
                return view.home?.inputSummary.processing==='unavailable'?{...record,processingUnavailableReason:'execution-unavailable' as const}:record;
            });
            const more = all.some(x => x.receiveSequence > (inputs.at(-1)?.receiveSequence ?? range.afterSequence));
            return { roleId: view.roleId, revision: snapshot?.revision ?? view.revision, binding: view.home?.panelBinding ?? null, inputs, processing: view.home?.inputSummary.processing ?? 'unavailable', afterSequence: range.afterSequence, limit: range.limit, total: all.length, more, nextAfterSequence: more ? inputs.at(-1)!.receiveSequence : null, ...(snapshot?.uncertainOperationId ? { uncertainOperationId: snapshot.uncertainOperationId } : {}) };
        }));
    }
    @Remote
    async readContextSources(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,page:ContextSourcePageRequest):Promise<ContextSourcePage>{
        this.requireOwner('readContextSources');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return role.owner.readContextSources(page);}));
    }
    @Remote
    async readLibrarySources(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:LibrarySourceQuery):Promise<LibrarySourcePage>{
        this.requireOwner('readLibrarySources');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return role.owner.readLibrarySources(request);}));
    }
    @Remote
    async readContactRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<import('./home/contact-rules.ts').ContactRulesSnapshot&{readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly effectiveFrom:'next-contact-attempt'}>{
        this.requireOwner('readContactRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),rules=await role.owner.readContactRules();return {...rules,roleId:expectedRoleId,bindingVersion:expectedBindingVersion,effectiveFrom:'next-contact-attempt' as const};}));
    }
    @Remote
    async editContactRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ContactRulesEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('editContactRules');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),raw=this.ctx.invocation?.request.args.request;
            if(!plainExact(raw,['operationId','value','expectedContactRulesVersion','expectedRevision'])||!validateContactRules(raw.value))throw new HomeError('INVALID_CONTACT_RULES');
            return role.owner.apply({kind:'edit-contact-rules',operationId:OperationId(raw.operationId),value:{...raw.value,quietHours:{...raw.value.quietHours}},expectedContactRulesVersion:raw.expectedContactRulesVersion as import('./home/ids.ts').ContactRulesVersion,expectedRevision:raw.expectedRevision as HomeRevision});
        }));
    }
    @Remote
    async readContactState(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<ContactView>{
        this.requireOwner('readContactState');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),{state,stamp,lastBlockedReason}=await role.owner.readContactState();
            return contactView(state,expectedRoleId,expectedBindingVersion,stamp,lastBlockedReason);
        }));
    }
    @Remote
    async readContactIntent(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ContactIntentRead):Promise<ContactIntentPartView>{
        this.requireOwner('readContactIntent');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),state=await role.owner.readConversation();return contactIntentPart(state,request);}));
    }
    @Remote
    async readMaintenance(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,page:CleanupCatalogPageRequest):Promise<LibraryMaintenanceView>{
        this.requireOwner('readMaintenance');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);
            const [view,cleanup]=await Promise.all([role.runtime.inspect(),role.owner.readCleanupCatalog(page)]);
            return {health:maintenanceHealth(view),cleanup};
        }));
    }
    @Remote
    async readLibraryOverview(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<import('./types.library.overview.ts').LibraryOverview>{
        this.requireOwner('readLibraryOverview');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);
            const [view,facts]=await Promise.all([role.runtime.inspect(),role.owner.readLibraryOverviewFacts()]);
            return projectLibraryOverview({...facts,view});
        }));
    }
    @Remote
    async previewCleanup(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,selection:CleanupSelection):Promise<CleanupPreview>{
        this.requireOwner('previewCleanup');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return role.owner.previewCleanup(admitCleanupSelection(this.ctx.invocation?.request.args.selection as CleanupSelection));}));
    }
    @Remote
    async requestCleanup(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:CleanupCommand):Promise<CleanupProgress|CleanupWaiting>{
        this.requireOwner('requestCleanup');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return role.owner.requestCleanup(admitCleanupCommand(this.ctx.invocation?.request.args.request as CleanupCommand));}));
    }
    @Remote
    async readCleanup(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,operationId:OperationId):Promise<CleanupProgress|CleanupWaiting|{readonly operationId:OperationId;readonly phase:'not-found'}>{
        this.requireOwner('readCleanup');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return role.owner.readCleanup(OperationId(operationId));}));
    }
    @Remote
    async readAutonomy(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<AutonomyView>{this.requireOwner('readAutonomy');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);const view=await role.runtime.inspect();return autonomyView(await role.owner.readConversation(),expectedRoleId,expectedBindingVersion,view.schedule?.lastSkipReason??null);}));}
    @Remote
    async setAutonomyPause(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:AutonomyPauseRequest):Promise<OwnerReceipt>{
        this.requireOwner('setAutonomyPause');
        return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),value=this.configurationValue('request','paused');
            if(typeof value!=='boolean')throw new HomeError('INVALID_AUTONOMY_PAUSE');
            const at=this.configurationValue('request','at');
            if(typeof at!=='string'||!Number.isFinite(Date.parse(at)))throw new HomeError('INVALID_AUTONOMY_PAUSE');
            const operationId=OperationId(this.configurationValue('request','operationId'));
            const receipt=await role.owner.apply({kind:'set-autonomy-pause',operationId,paused:value,at});
            return receipt;
        }));
    }
    @Remote
    async readAutonomyAttribution(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:AutonomyAttributionRequest):Promise<AutonomyAttributionView>{
        this.requireOwner('readAutonomyAttribution');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),raw=this.ctx.invocation?.request.args.request;
            // Omitting the selector lists every autonomous run; a selector must be exactly {runId}.
            if(raw===undefined||raw!==null&&typeof raw==='object'&&!Array.isArray(raw)&&Object.getPrototypeOf(raw)===Object.prototype&&Reflect.ownKeys(raw).length===0)return {runs:await role.owner.readAutonomyAttribution({})};
            if(!plainExact(raw,['runId'])||typeof raw.runId!=='string'||!raw.runId.length)throw new HomeError('INVALID_AUTONOMY_ATTRIBUTION');
            return {runs:await role.owner.readAutonomyAttribution({runId:RunId(raw.runId as string)})};
        }));
    }
    @Remote
    async reviewAutonomyClock(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ClockReviewRequest):Promise<OwnerReceipt>{
        this.requireOwner('reviewAutonomyClock');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),raw=this.ctx.invocation?.request.args.request;
            if(!plainExact(raw,['operationId','expectedRevision']))throw new HomeError('INVALID_CLOCK_REVIEW');
            return role.owner.apply({kind:'review-autonomy-clock',operationId:OperationId(raw.operationId),expectedRevision:HomeRevision(raw.expectedRevision)});
        }));
    }
    @Remote
    async editAutonomyRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:AutonomyRulesEditRequest):Promise<OwnerReceipt>{this.requireOwner('editAutonomyRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion),value=this.configurationValue('request','value');if(!validAutonomyRules(value))throw new HomeError('INVALID_AUTONOMY_RULES');return role.owner.apply({...request,value,kind:'edit-autonomy-rules'});}));}
    @Remote
    async wakeRole(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:WakeRoleRequest):Promise<WakeReceipt>{this.requireOwner('wakeRole');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return role.runtime.wake({operationId:request.operationId,reason:'owner-single-opportunity'});}));}
    @Remote
    async readActivityRecord(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ActivityRecordRead):Promise<ActivityRecordPart>{this.requireOwner('readActivityRecord');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return activityRecordPart(await role.owner.readConversation(),request);}));}
    @Remote
    async readKnowledge(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,page:KnowledgePageRequest):Promise<KnowledgePage>{
        this.requireOwner('readKnowledge');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return knowledgePage(await role.owner.readKnowledge(),page);}));
    }
    @Remote
    async queryKnowledgeLibrary(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,query:KnowledgeLibraryQuery):Promise<KnowledgeLibraryPage>{
        this.requireOwner('queryKnowledgeLibrary');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return queryKnowledgeLibrary(await role.owner.readKnowledge(),query);}));
    }
    @Remote
    async readKnowledgeLibraryDetail(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:KnowledgeLibraryDetailRequest):Promise<KnowledgeLibraryDetail>{
        this.requireOwner('readKnowledgeLibraryDetail');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return readKnowledgeLibraryDetail(await role.owner.readKnowledge(),request);}));
    }
    @Remote
    async readKnowledgeRecord(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:KnowledgeRecordRead):Promise<KnowledgeRecordPart>{
        this.requireOwner('readKnowledgeRecord');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return knowledgeRecordPart(await role.owner.readKnowledge(),request);}));
    }
    @Remote
    async readKnowledgeDifference(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:KnowledgeDifferenceRequest):Promise<KnowledgeDifference>{
        this.requireOwner('readKnowledgeDifference');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return knowledgeDifference(await role.owner.readKnowledge(),request);}));
    }
    @Remote
    async rollbackKnowledge(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:KnowledgeRollbackRequest):Promise<OwnerReceipt>{
        this.requireOwner('rollbackKnowledge');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);const command=knowledgeRollbackCommand(this.ctx.invocation?.request.args.request);return role.owner.apply(command);}));
    }
    @Remote
    async readKnowledgeOperation(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,operationId:OperationId):Promise<HomeOperation>{
        this.requireOwner('readKnowledgeOperation');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return role.owner.readOperation(OperationId(operationId));}));
    }
    @Remote
    async readContextSource(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ContextSourceRead):Promise<ContextSourcePart>{
        this.requireOwner('readContextSource');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedBoundRole(expectedRoleId,expectedBindingVersion);return role.owner.readContextSource(request);}));
    }
    @Remote
    async readConversation(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,page?:ConversationPage):Promise<ConversationView>{
        this.requireOwner('readConversation');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedRole(expectedRoleId);const view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');
            const range=page??{offset:0,limit:20};if(!Number.isSafeInteger(range.offset)||range.offset<0||!Number.isSafeInteger(range.limit)||range.limit<1||range.limit>20)throw new HomeError('INVALID_CONVERSATION_PAGE');
            const state=await role.owner.readConversation();const max=Math.max(state.turns.length,state.attempts.length,state.replies.length,state.nativeRecords.length);return {roleId:expectedRoleId,revision:state.revision,bindingVersion:expectedBindingVersion,rules:state.rules,retryRules:state.retryRules,budget:conversationBudgetView(state),offset:range.offset,limit:range.limit,totalTurns:state.turns.length,totalAttempts:state.attempts.length,totalToolAttempts:state.attempts.filter(x=>x.kind==='tool').length,totalReplies:state.replies.length,totalNativeRecords:state.nativeRecords.length,nextOffset:range.offset+range.limit<max?range.offset+range.limit:null,
                turns:state.turns.slice(range.offset,range.offset+range.limit).map(x=>({runId:x.runId,inputIds:x.inputIds,status:x.status,deadline:x.deadline,outcome:x.outcome?.kind??'pending',reason:x.outcome&&'reason' in x.outcome?x.outcome.reason:''})),
                attempts:state.attempts.slice(range.offset,range.offset+range.limit).map(x=>({channel:state.turns.find(t=>t.runId===x.runId)?.bindingId==='qq-'+expectedRoleId?'qq':'panel',kind:x.kind,attemptId:x.attemptId,runId:x.runId,reservedAt:x.reservedAt,enteredAt:x.enteredAt??null,dispatchObserved:x.outcome?.kind==='not-dispatched'?false:x.outcome?.data&&typeof x.outcome.data==='object'&&'dispatchObserved' in x.outcome.data&&typeof x.outcome.data.dispatchObserved==='boolean'?x.outcome.data.dispatchObserved:null,outcome:x.outcome?.kind??'pending',code:viewCode(x.outcome?.code),source:x.source,modelOperation:x.modelOperation??null,modelFailure:x.outcome?.modelFailure??null,tool:x.kind==='tool'?toolAttemptSummary(x,state.nativeRecords):null})),
                nativeRecords:state.nativeRecords.slice(range.offset,range.offset+range.limit).map(x=>({channel:state.turns.find(t=>t.runId===x.runId)?.bindingId==='qq-'+expectedRoleId?'qq':'panel',recordId:NativeRecordRef(x.provenance+'/'+x.nativeId),runId:x.runId,provenance:x.provenance,summary:nativeRecordSummary(x)})),
                replies:state.replies.slice(range.offset,range.offset+range.limit).map(({text,...x})=>({...x,codePoints:Array.from(text).length})),more:range.offset+range.limit<max,tools:['role_read','role_file','role_web_search','role_web_fetch','role_propose'],retrieval:'local-lexical',automaticRetry:'controlled'};
        }));
    }
    @Remote
    async readExecutionLibrary(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ExecutionLibraryQuery):Promise<ExecutionLibraryPage>{
        this.requireOwner('readExecutionLibrary');return this.business(()=>this.exclusive(async()=>{
            validateExecutionLibraryQuery(request);
            const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect(),panelBinding=view.home?.panelBinding;
            if(!panelBinding||panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');
            if(!this.home)throw new HomeError('HOME_UNAVAILABLE');
            const snapshot=await this.home.readSnapshot(),state=await role.owner.readConversation();
            return executionLibraryPage(state,expectedRoleId,panelBinding,snapshot.qqBinding??null,request);
        }));
    }
    @Remote
    async readExecutionLibraryDetail(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ExecutionLibraryDetailRequest):Promise<ExecutionLibraryDetail>{
        this.requireOwner('readExecutionLibraryDetail');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect(),panelBinding=view.home?.panelBinding;
            if(!panelBinding||panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');
            if(!this.home)throw new HomeError('HOME_UNAVAILABLE');
            return readExecutionLibraryDetail(this.home,expectedRoleId,panelBinding,request);
        }));
    }
    @Remote
    async readExecutionLibraryPart(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ExecutionLibraryPartRequest):Promise<ExecutionLibraryPart>{
        this.requireOwner('readExecutionLibraryPart');return this.business(()=>this.exclusive(async()=>{
            const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect(),panelBinding=view.home?.panelBinding;
            if(!panelBinding||panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');
            if(!this.home)throw new HomeError('HOME_UNAVAILABLE');
            return readExecutionLibraryPart(this.home,expectedRoleId,panelBinding,request);
        }));
    }
    @Remote
    async retryArchives(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<ArchiveRetryReceipt>{
        this.requireOwner('retryArchives');return this.business(async()=>{const role=await this.exclusive(async()=>{const selected=await this.expectedRole(expectedRoleId);const view=await selected.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return selected;});return role.owner.retryArchives();});
    }
    @Remote
    async readExecutionRecord(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ExecutionRecordRead):Promise<OwnerExecutionRecordPage>{
        this.requireOwner('readExecutionRecord');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId);const view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return readStableExecutionRecord(role.owner,request,(state,result)=>{const turn=state.turns.find(x=>x.runId===result.runId);if(!turn||turn.bindingId!==view.home!.panelBinding.bindingId||turn.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');});}));
    }
    @Remote
    async readReply(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ReplyRead):Promise<ReplyPage>{
        this.requireOwner('readReply');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId);const view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');const reply=await role.owner.readReply(request);if(reply.bindingId!==view.home.panelBinding.bindingId||reply.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return reply;}));
    }
    @Remote
    async readWebRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<WebRulesView>{
        this.requireOwner('readWebRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return {...await role.owner.readWebRules(),roleId:expectedRoleId,bindingVersion:expectedBindingVersion,effectiveFrom:'next-web-admission'};}));
    }
    @Remote
    async editWebRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:WebRulesEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('editWebRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');const value=this.configurationValue('request','value');if(!validateWebRules(value))throw new HomeError('INVALID_WEB_RULES');return role.owner.apply({...request,value,kind:'edit-web-rules'});}));
    }
    @Remote
    async readProposalRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<ProposalRulesView>{this.requireOwner('readProposalRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return {...await role.owner.readProposalRules(),roleId:expectedRoleId,bindingVersion:expectedBindingVersion,effectiveFrom:'next-proposal-admission'};}));}
    @Remote
    async editProposalRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ProposalRulesEditRequest):Promise<OwnerReceipt>{this.requireOwner('editProposalRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');const value=this.configurationValue('request','value');if(!validateProposalRules(value))throw new HomeError('INVALID_PROPOSAL_RULES');return role.owner.apply({...request,value,kind:'edit-proposal-rules'});}));}
    @Remote
    async readRetryRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<RetryRulesView>{
        this.requireOwner('readRetryRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return {...await role.owner.readRetryRules(),roleId:expectedRoleId,bindingVersion:expectedBindingVersion,effectiveFrom:'next-retry-admission'};}));
    }
    @Remote
    async editRetryRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:RetryRulesEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('editRetryRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');const value=this.configurationValue('request','value');if(!validateRetryRules(value))throw new HomeError('INVALID_RETRY_RULES');return role.owner.apply({...request,value,kind:'edit-retry-rules'});}));
    }
    @Remote
    async readFileRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<FileRulesView>{
        this.requireOwner('readFileRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return {...await role.owner.readFileRules(),roleId:expectedRoleId,bindingVersion:expectedBindingVersion,effectiveFrom:'next-file-admission'};}));
    }
    @Remote
    async editFileRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:FileRulesEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('editFileRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');const value=this.configurationValue('request','value');if(!validateFileRules(value))throw new HomeError('INVALID_FILE_RULES');return role.owner.apply({...request,value,kind:'edit-file-rules'});}));
    }
    @Remote
    async readReadRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion):Promise<ReadRulesView>{
        this.requireOwner('readReadRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return {...await role.owner.readReadRules(),roleId:expectedRoleId,bindingVersion:expectedBindingVersion,effectiveFrom:'next-tool-admission'};}));
    }
    @Remote
    async editReadRules(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ReadRulesEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('editReadRules');return this.business(()=>this.exclusive(async()=>{const role=await this.expectedRole(expectedRoleId),view=await role.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');const value=this.configurationValue('request','value');if(!validateReadRules(value))throw new HomeError('INVALID_READ_RULES');return role.owner.apply({...request,value,kind:'edit-read-rules'});}));
    }
    @Remote
    async editConversation(expectedRoleId:RoleId,expectedBindingVersion:BindingVersion,request:ConversationEditRequest):Promise<OwnerReceipt>{
        this.requireOwner('editConversation');return this.business(async()=>{const role=await this.exclusive(async()=>{const selected=await this.expectedRole(expectedRoleId);const view=await selected.runtime.inspect();if(view.home?.panelBinding.bindingVersion!==expectedBindingVersion)throw new HomeError('BINDING_CHANGED');return selected;});const value=this.configurationValue('request','value');if(!validateConversationSettings(value))throw new HomeError('INVALID_CONVERSATION_SETTINGS');return role.owner.apply({...request,value,kind:'edit-conversation'});});
    }
    @Remote
    async previewProjection(projectionId: ProjectionId, expectedRoleId: string): Promise<ProjectionPreview> {
        this.requireOwner('previewProjection');
        return this.business(() => this.exclusive(async () => { const role = await this.role; this.requireProjectionSelection(expectedRoleId); return role.owner.previewProjection(projectionId); }));
    }
    @Remote
    async manageProjection(command: ProjectionCommand, expectedRoleId: string): Promise<OwnerReceipt> {
        this.requireOwner('manageProjection');
        return this.business(() => this.exclusive(async () => {
            await this.role; this.requireProjectionSelection(expectedRoleId);
            if (command.kind !== 'import-projection' && command.kind !== 'rebuild-projection') throw new HomeError('UNSUPPORTED_OWNER_COMMAND');
            return (await this.role).owner.apply(command);
        }));
    }
    @Remote
    async readDiagnostic(expectedRoleId: string): Promise<HomeDiagnostic> {
        this.requireOwner('readDiagnostic');
        return this.business(() => this.exclusive(async () => { const role = await this.role; this.requireProjectionSelection(expectedRoleId); return role.owner.readDiagnostic(); }));
    }
    @Remote
    async readPreservedProjection(operationId: OperationId, expectedRoleId: string): Promise<PreservedProjection> {
        this.requireOwner('readPreservedProjection');
        return this.business(() => this.exclusive(async () => { const role = await this.role; this.requireProjectionSelection(expectedRoleId); return role.owner.readPreservedProjection(operationId); }));
    }
    @Remote
    async inspectBackup(path: string, expectedRoleId: string): Promise<HomeDiagnostic> {
        this.requireOwner('inspectBackup');
        return this.business(() => this.exclusive(async () => { await this.role; this.requireProjectionSelection(expectedRoleId); const physical=await localDirectoryIdentity(await realpath(path)).catch(()=>undefined);if(!physical){const report=await diagnoseRoleHome(path,expectedRoleId?{expectedRoleId:RoleId(expectedRoleId)}:{});if(report.verifiedRoleId)throw new HomeError('FILE_PROTECTION_UNPROVEN');return report;}retainKnownFileHome(this.ctx,{...physical,roleId:RoleId(expectedRoleId),source:'diagnostic-candidate'});const anchor=this.fileMappingProfile().protectionCacheId;if(this.ctx.get('storage'))await fileProtectionCache(this.ctx).snapshot(anchor||undefined,knownFileHomes(this.ctx),true);else if(anchor)throw new HomeError('FILE_SOURCE_CACHE_UNAVAILABLE');const report=await diagnoseRoleHome(path, expectedRoleId ? { expectedRoleId:RoleId(expectedRoleId) } : {});if(report.verifiedRoleId){const after=await localDirectoryIdentity(physical.root);if(after.fingerprint!==physical.fingerprint)throw new HomeError('FILE_PROTECTION_UNPROVEN');retainKnownFileHome(this.ctx,{...physical,roleId:RoleId(report.verifiedRoleId),source:'verified-diagnostic'});if(this.ctx.get('storage'))await fileProtectionCache(this.ctx).snapshot(this.fileMappingProfile().protectionCacheId||undefined,knownFileHomes(this.ctx),true);}return report; }));
    }
    @Remote
    async retryHome(expectedRoleId: string): Promise<HomeDiagnostic> {
        this.requireOwner('retryHome');
        return this.business(() => this.exclusive(async () => {
            await this.role; this.requireProjectionSelection(expectedRoleId);
            const path = this.homePath || this.config.bootstrap.get().path;
            if (!path) throw new HomeError('HOME_NOT_OPEN');
            const previous = await this.role; previous.lifetime.requestStop('migration'); await previous.lifetime.stopped;
            this.home = undefined; this.bootError = '';
            const opened = await openRoleHomeForRuntime(path, expectedRoleId ? { expectedRoleId:RoleId(expectedRoleId) } : {});
            this.homePath = path; this.diagnosticExpectedRoleId = expectedRoleId;
            if ('readSnapshot' in opened) this.home = opened;
            this.role = this.home&&this.profileSelectsHome(this.home.roleId,path)?this.startConnectedHome(this.home):this.startOwnedRole(opened,{});
            return (await this.role).owner.readDiagnostic();
        }));
    }
    private selectedRoleId(): string | null { return this.home?.roleId || this.diagnosticExpectedRoleId || this.config.bootstrap.get().roleId || null; }
    private requireProjectionSelection(expectedRoleId: string): void {
        if (typeof expectedRoleId !== 'string' || expectedRoleId !== (this.selectedRoleId() ?? '')) throw new HomeError('IDENTITY_CONFLICT');
    }
    private requireOwner(action: string): void {
        if (this.ctx.invocation?.peer.principal.kind !== 'owner') {
            throw new RemoteError('role/owner-required', '此操作需要 Gateway 用户身份。', { action });
        }
    }
}
export function apply(ctx: Context, config: Config): void {
    for (const file of ['client.js', 'typert.host.js', 'typert.host.d.ts', 'typert.remote-client.js', 'typert.remote-client.d.ts']) {
        try {
            if (!statSync(new URL('./' + file, import.meta.url)).isFile())
                throw new Error('not a file');
        }
        catch {
            throw Object.assign(new Error(`角色伙伴缺少预构建产物 lib/${file}。重新构建并安装完整组合包。`), { code: 'PACKAGE_ARTIFACT_MISSING' });
        }
    }
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
        engines: {
            dsh: string;
        };
    };
    if (!supportsDshVersion(getDshRuntimeVersion())) {
        throw Object.assign(new Error(`角色伙伴需要 DSH ${supportedDshVersions.join(' 或 ')}。安装兼容组合包后重新启动。`), { code: 'DSH_VERSION_MISMATCH' });
    }
    installNativeOwnershipFence(ctx);
    ctx.plugin(RoleCompanionController, config);
    ctx.on('loader/volatile-update', paths => {const controller=ctx.get('roleCompanion');if(paths.some(path=>path[0]==='bootstrap'))controller?.reconcileBootstrap();if(paths.some(path=>path[0]==='qq'))controller?.reconcileQQ();});
}
