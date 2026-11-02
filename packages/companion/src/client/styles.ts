import {sourceLibraryStyles} from './library/source-styles.ts';

const styleId = 'dsh-role-companion/panel.css';

const css = `
${sourceLibraryStyles}
.rcPanel {
  --rc-border: var(--dsw-alias-border-l2, rgba(0, 0, 0, .1));
  --rc-blue: var(--dsw-alias-state-business-primary, #4176e6);
  --rc-blue-soft: color-mix(in srgb, var(--rc-blue) 9%, transparent);
  --rc-danger: var(--dsw-alias-state-error-primary, #d92d20);
  --rc-success: var(--dsw-alias-state-success-primary, #159947);
  --rc-warning: var(--dsw-alias-state-warn-primary, #d68a1d);
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 920px;
  min-width: 0;
  padding: 2px 0 36px;
  color: var(--dsw-alias-label-primary);
  font-family: var(--dsw-font-family);
  font-size: 14px;
  line-height: 22px;
}
.rcPanel *,
.rcPanel *::before,
.rcPanel *::after {
  box-sizing: border-box;
}
.rcHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 2px 0 18px;
  border-bottom: 1px solid var(--rc-border);
}
.rcHeaderCopy {
  min-width: 0;
}
.rcEyebrow {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}
.rcTitleRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 3px;
}
.rcTitleRow h2 {
  margin: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}
.rcSubtitle,
.rcStatusDetail {
  max-width: 620px;
  margin: 6px 0 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.rcStatusDetail {
  color: var(--dsw-alias-label-secondary);
}
.rcStatus {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 2px 8px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}
.rcStatus::before {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary);
  content: "";
}
.rcStatus[data-tone="success"] {
  border-color: color-mix(in srgb, var(--rc-success) 24%, var(--rc-border));
  background: color-mix(in srgb, var(--rc-success) 9%, transparent);
  color: var(--rc-success);
}
.rcStatus[data-tone="success"]::before { background: var(--rc-success); }
.rcStatus[data-tone="warning"] {
  border-color: color-mix(in srgb, var(--rc-warning) 28%, var(--rc-border));
  background: color-mix(in srgb, var(--rc-warning) 10%, transparent);
  color: var(--dsw-alias-state-warn-label, var(--rc-warning));
}
.rcStatus[data-tone="warning"]::before { background: var(--rc-warning); }
.rcStatus[data-tone="danger"] {
  border-color: color-mix(in srgb, var(--rc-danger) 24%, var(--rc-border));
  background: color-mix(in srgb, var(--rc-danger) 8%, transparent);
  color: var(--rc-danger);
}
.rcStatus[data-tone="danger"]::before { background: var(--rc-danger); }
.rcRefreshButton {
  flex: none;
  margin-top: 4px;
}
.rcHeaderActions {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.rcHeaderActions > button {
  margin-top: 0;
}
.rcMetrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--rc-border);
}
.rcMetric {
  min-width: 0;
  padding: 11px 13px;
  background: var(--dsw-alias-bg-layer-2);
}
.rcMetric dt {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcMetric dd {
  margin: 2px 0 0;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  overflow-wrap: anywhere;
}
.rcTechnical {
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 54%, transparent);
}
.rcTechnical > summary {
  cursor: pointer;
  padding: 10px 12px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}
.rcTechnical[open] > summary {
  border-bottom: 1px solid var(--rc-border);
}
.rcTechnicalBody {
  padding: 12px;
}
.rcTechnicalBody dl {
  display: grid;
  grid-template-columns: minmax(96px, max-content) minmax(0, 1fr);
  gap: 7px 16px;
  margin: 0;
  font-size: 12px;
  line-height: 18px;
}
.rcTechnicalBody dt {
  color: var(--dsw-alias-label-tertiary);
}
.rcTechnicalBody dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}
.rcTechnicalBody p {
  margin: 12px 0 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}
.rcUpdateFacts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}
.rcUpdateFacts > div {
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
}
.rcUpdateFacts dt {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcUpdateFacts dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  line-height: 18px;
}
.rcSectionNav {
  position: sticky;
  z-index: 2;
  top: 0;
  display: flex;
  gap: 4px;
  margin: -6px -2px 0;
  overflow-x: auto;
  padding: 8px 2px;
  border-bottom: 1px solid var(--rc-border);
  background: var(--dsw-alias-bg-layer-2);
  scrollbar-width: thin;
}
.rcLibraryNav {
  position: sticky;
  z-index: 2;
  top: 0;
  margin: 0 -2px;
  padding: 9px 2px;
  border-bottom: 1px solid var(--rc-border);
  background: var(--dsw-alias-bg-layer-2);
}
.rcLibraryFullNav {
  display: flex;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}
.rcLibraryMenu {
  display: none;
}
.rcLibraryMenu > summary {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 10px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  list-style: none;
}
.rcLibraryMenu > summary::-webkit-details-marker {
  display: none;
}
.rcLibraryMenu > summary::after {
  width: 7px;
  height: 7px;
  margin: -4px 3px 0 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  content: "";
  transform: rotate(45deg);
}
.rcLibraryMenu[open] > summary::after {
  margin-top: 4px;
  transform: rotate(225deg);
}
.rcLibraryMenu > summary span {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.rcLibraryMenu > summary strong {
  flex: 1;
  text-align: right;
}
.rcLibraryMenuOptions {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  margin-top: 6px;
  padding: 6px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
  background: var(--dsw-alias-bg-module-platform);
}
.rcPanel .rcLibraryNav button {
  flex: 0 0 auto;
  min-height: 32px;
  padding: 4px 12px;
  border-color: transparent;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.rcPanel .rcLibraryNav button:hover,
.rcPanel .rcLibraryNav button:focus-visible {
  color: var(--dsw-alias-label-primary);
}
.rcPanel .rcLibraryNav button[aria-current="page"] {
  border-color: color-mix(in srgb, var(--rc-blue) 22%, transparent);
  background: var(--rc-blue-soft);
  color: var(--rc-blue);
}
.rcLibraryContent {
  min-width: 0;
  padding-top: 18px;
}
.rcLibraryContent > section,
.rcLibraryOverview {
  min-width: 0;
}
.rcLibraryContent h3 {
  margin: 0 0 8px;
  color: var(--dsw-alias-label-primary);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}
.rcLibraryContent p {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.rcLibraryFacts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  margin: 16px 0;
  overflow: hidden;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--rc-border);
}
.rcLibraryFacts > div {
  min-width: 0;
  padding: 10px 12px;
  background: var(--dsw-alias-bg-layer-2);
}
.rcLibraryFacts dt {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcLibraryFacts dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
}
.rcLibraryLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.rcOverviewHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.rcOverviewHeader h3 {
  margin-bottom: 2px;
}
.rcOverviewAttention,
.rcOverviewRecent {
  margin-top: 18px;
}
.rcLibraryOverview h4 {
  margin: 0 0 8px;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}
.rcOverviewAttention > ol,
.rcOverviewRecent > ol {
  display: grid;
  gap: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--rc-border);
  list-style: none;
}
.rcOverviewAttention > ol > li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  background: var(--dsw-alias-bg-layer-2);
}
.rcOverviewAttention strong {
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
.rcOverviewAttention p {
  margin: 2px 0 0;
}
.rcOverviewAttention button {
  white-space: nowrap;
}
.rcOverviewRecent > ol > li {
  background: var(--dsw-alias-bg-layer-2);
}
.rcOverviewRecent > ol button {
  display: grid;
  width: 100%;
  gap: 4px;
  padding: 11px 14px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}
.rcOverviewRecent > ol button > span:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--dsw-alias-label-primary);
}
.rcOverviewRecent time {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  white-space: nowrap;
}
.rcOverviewRecent > ol button > span:last-child {
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rcOverviewCategories {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 18px;
}
.rcOverviewCategories button {
  min-height: 40px;
}
.rcOverviewError {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--rc-danger) 28%, var(--rc-border));
  border-radius: 8px;
}
.rcOverviewError p {
  margin: 0;
}
.rcLibraryState {
  margin: 0;
  padding: 16px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--dsw-alias-bg-module-platform);
}
.rcLibraryMaintenance {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.rcMaintenanceHealth {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--rc-border);
  border-left: 3px solid var(--dsw-alias-label-tertiary);
  border-radius: 8px;
  background: var(--dsw-alias-bg-module-platform);
}
.rcMaintenanceHealth h3 {
  margin-top: 2px;
}
.rcMaintenanceHealth p {
  max-width: 680px;
  margin: 0;
}
.rcMaintenanceHealth > strong {
  flex: none;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
}
.rcMaintenanceHealth[data-tone="success"] { border-left-color: var(--rc-success); }
.rcMaintenanceHealth[data-tone="warning"] { border-left-color: var(--rc-warning); }
.rcMaintenanceHealth[data-tone="danger"] { border-left-color: var(--rc-danger); }
.rcMaintenanceNav {
  position: static;
  margin: 0;
}
.rcMaintenancePanel {
  min-width: 0;
}
.rcMaintenancePanel > section,
.rcMaintenanceCleanup {
  min-width: 0;
}
.rcMaintenanceSectionHeading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.rcMaintenanceSectionHeading > div {
  min-width: 0;
}
.rcMaintenanceSectionHeading p {
  margin: 0;
}
.rcMaintenanceRange {
  flex: none;
  white-space: nowrap;
}
.rcProjectionMaintenance,
.rcDiagnosticRecovery {
  display: grid;
  gap: 18px;
  min-width: 0;
}
.rcMaintenanceStatus {
  display: grid;
  gap: 3px;
  padding: 10px 12px;
  border-left: 3px solid var(--dsw-alias-label-tertiary);
  background: var(--dsw-alias-bg-module-platform);
}
.rcMaintenanceStatus[data-tone="success"] { border-left-color: var(--rc-success); }
.rcMaintenanceStatus[data-tone="warning"] { border-left-color: var(--rc-warning); }
.rcMaintenanceStatus[data-tone="danger"] { border-left-color: var(--rc-danger); }
.rcMaintenanceStatus > strong {
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
.rcMaintenanceStatus p {
  margin: 0;
}
.rcMaintenanceStatus small {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcProjectionDiff {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
}
.rcProjectionText {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.rcProjectionText h4,
.rcProjectionRecovery h4,
.rcProjectionOperation h4,
.rcDiagnosticHeading h4 {
  margin: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}
.rcProjectionText textarea,
.rcProjectionOperation textarea {
  box-sizing: border-box;
  width: 100%;
  resize: vertical;
}
.rcProjectionText small {
  overflow-wrap: anywhere;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcProjectionFacts,
.rcDiagnosticFacts,
.rcBackupVerificationFacts {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--rc-border);
}
.rcProjectionFacts > div,
.rcDiagnosticFacts > div,
.rcBackupVerificationFacts > div {
  min-width: 0;
  padding: 9px 11px;
  background: var(--dsw-alias-bg-layer-2);
}
.rcProjectionFacts dt,
.rcDiagnosticFacts dt,
.rcBackupVerificationFacts dt {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcProjectionFacts dd,
.rcDiagnosticFacts dd,
.rcBackupVerificationFacts dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  line-height: 18px;
}
.rcProjectionActions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  grid-column: 1 / -1;
}
.rcProjectionRecovery,
.rcProjectionOperation,
.rcDiagnosticSection {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--rc-border);
}
.rcProjectionRecovery > p,
.rcProjectionOperation > p,
.rcDiagnosticSection > p {
  margin: 0;
}
.rcProjectionRecovery > button,
.rcProjectionOperation > button {
  justify-self: start;
}
.rcProjectionOperation label {
  display: grid;
  gap: 6px;
}
.rcDiagnosticHeading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.rcDiagnosticHeading > div {
  min-width: 0;
}
.rcDiagnosticHeading p {
  margin: 2px 0 0;
}
.rcDiagnosticHeading > button {
  flex: none;
}
.rcDiagnosticSection .rcDiagnosticFacts {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.rcDiagnosticEvidence {
  min-width: 0;
}
.rcDiagnosticEvidence ul {
  display: grid;
  gap: 4px;
  margin: 8px 0;
  padding-left: 20px;
}
.rcDiagnosticEvidence li {
  overflow-wrap: anywhere;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 17px;
}
.rcDiagnosticSection label {
  display: grid;
  gap: 6px;
}
.rcCleanupRows {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.rcCleanupRows > li {
  min-width: 0;
}
.rcKnowledgeLibrary {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.rcKnowledgeHeading,
.rcKnowledgeRecordTop,
.rcKnowledgePaging,
.rcKnowledgeOperationActions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.rcKnowledgeHeading p {
  max-width: 700px;
  margin: 4px 0 0;
}
.rcKnowledgeCount {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.rcKnowledgeTabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--rc-border);
}
.rcPanel .rcKnowledgeTabs button {
  min-height: 32px;
  padding: 4px 12px;
  border-color: transparent;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
}
.rcPanel .rcKnowledgeTabs button[aria-selected="true"] {
  border-bottom-color: var(--rc-blue);
  background: var(--rc-blue-soft);
  color: var(--rc-blue);
}
.rcKnowledgeReadonly {
  margin: 0;
  padding: 8px 10px;
  border-left: 3px solid var(--rc-amber);
  background: color-mix(in srgb, var(--rc-amber) 8%, transparent);
}
.rcKnowledgeFilters {
  display: grid;
  grid-template-columns: minmax(160px, 1.4fr) repeat(3, minmax(120px, 1fr));
  gap: 8px;
  align-items: end;
}
.rcKnowledgeFilters label,
.rcKnowledgeRollback label {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
}
.rcKnowledgeFilters input,
.rcKnowledgeFilters select,
.rcKnowledgeRollback textarea {
  min-width: 0;
  width: 100%;
  min-height: 32px;
  box-sizing: border-box;
}
.rcKnowledgeFilters > button {
  align-self: end;
  min-height: 32px;
}
.rcKnowledgeLayout {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
}
.rcCleanupRows > li > label {
  flex-direction: row;
  gap: 10px;
  padding: 12px;
  cursor: pointer;
}
.rcCleanupRows > li[data-cleanup-state="cleaned"] > label,
.rcCleanupRows > li[data-cleanup-state="incomplete"] > label {
  cursor: default;
}
.rcCleanupRowCopy {
  display: grid;
  flex: 1;
  gap: 4px;
  min-width: 0;
}
.rcCleanupRowTitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.rcCleanupRowTitle strong {
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 600;
}
.rcCleanupState {
  padding: 0 6px;
  border: 1px solid var(--rc-border);
  border-radius: 4px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 18px;
}
.rcCleanupPreview {
  display: -webkit-box;
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.rcCleanupRowCopy time {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcKnowledgeListPanel,
.rcKnowledgeDetailPanel {
  min-width: 0;
  padding: 12px;
}
.rcKnowledgeListPanel {
  border-right: 1px solid var(--rc-border);
  background: var(--dsw-alias-bg-module-platform);
}
.rcKnowledgeRange {
  margin: 0 0 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcCleanupPager {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}
.rcCleanupDerived {
  max-width: 420px;
  margin-top: 12px;
}
.rcCleanupImpact,
.rcCleanupRecovery,
.rcCleanupProgress {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 52%, var(--dsw-alias-bg-layer-2));
}
.rcCleanupImpactGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.rcCleanupImpactGrid > section {
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
}
.rcCleanupImpactGrid h4,
.rcCleanupRecovery h4 {
  margin: 0 0 6px;
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  line-height: 18px;
}
.rcCleanupImpactGrid ul,
.rcCleanupTasks {
  margin: 0;
  padding-left: 18px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.rcCleanupImpact > button,
.rcCleanupRecoveryActions {
  margin-top: 12px;
}
.rcCleanupRecovery {
  display: grid;
  gap: 10px;
}
.rcCleanupRecovery > label {
  max-width: 520px;
}
.rcCleanupRecoveryActions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.rcCleanupTasks > li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 4px 0;
}
.rcPanel .rcDangerAction:not(:disabled) {
  border-color: var(--rc-danger);
  background: var(--rc-danger);
  color: #fff;
}
.rcCleanupSelectionBar {
  position: sticky;
  z-index: 3;
  bottom: 0;
  display: grid;
  gap: 8px;
  margin: 16px 0 0;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--rc-blue) 30%, var(--rc-border));
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  box-shadow: 0 -5px 18px color-mix(in srgb, #000 12%, transparent);
}
.rcCleanupSelectionBar > p {
  margin: 0;
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.rcCleanupSelectionBar > ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 92px;
  margin: 0;
  overflow: auto;
  padding: 0;
  list-style: none;
}
.rcCleanupSelectionBar > ul > li {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  max-width: min(100%, 360px);
  padding: 5px 7px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 17px;
}
.rcCleanupSelectionBar > ul > li > span {
  overflow: hidden;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
}
.rcCleanupSelectionBar > ul > li > button {
  min-height: 22px;
  padding: 0 5px;
  font-size: 11px;
}
.rcCleanupSelectionActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.rcPanel .rcPrimaryAction:not(:disabled) {
  border-color: var(--rc-blue);
  background: var(--rc-blue);
  color: #fff;
}
@container (max-width: 520px) {
  .rcMaintenanceHealth,
  .rcMaintenanceSectionHeading,
  .rcCleanupImpactGrid {
    flex-direction: column;
  }
  .rcCleanupImpactGrid {
    display: grid;
    grid-template-columns: 1fr;
  }
  .rcMaintenanceRange {
    white-space: normal;
  }
  .rcCleanupSelectionActions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .rcCleanupSelectionBar > ul > li {
    max-width: 100%;
  }
}
.rcKnowledgeRecords,
.rcKnowledgeDifference,
.rcKnowledgeDetail section ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.rcKnowledgeRecords {
  max-height: 620px;
  overflow: auto;
}
.rcPanel .rcKnowledgeRecord {
  display: grid;
  gap: 5px;
  width: 100%;
  padding: 10px;
  border-color: transparent;
  background: transparent;
  color: inherit;
  text-align: left;
}
.rcPanel .rcKnowledgeRecord:hover,
.rcPanel .rcKnowledgeRecord:focus-visible,
.rcPanel .rcKnowledgeRecord[aria-pressed="true"] {
  border-color: color-mix(in srgb, var(--rc-blue) 28%, var(--rc-border));
  background: var(--rc-blue-soft);
}
.rcKnowledgeRecordTop strong {
  min-width: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 19px;
  overflow-wrap: anywhere;
}
.rcKnowledgeStatus {
  flex: none;
  padding: 1px 6px;
  border: 1px solid var(--rc-border);
  border-radius: 999px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  line-height: 16px;
}
.rcKnowledgeExcerpt {
  display: -webkit-box;
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.rcKnowledgeMeta {
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  line-height: 15px;
  overflow-wrap: anywhere;
}
.rcKnowledgePaging {
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--rc-border);
}
.rcKnowledgePaging span {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.rcKnowledgeEmpty,
.rcKnowledgePlaceholder {
  margin: 0;
  padding: 24px 16px;
  border: 1px dashed var(--rc-border);
  border-radius: 8px;
  text-align: center;
}
.rcKnowledgePlaceholder {
  min-height: 120px;
  display: grid;
  place-content: center;
}
.rcKnowledgeError {
  display: grid;
  gap: 8px;
  justify-items: start;
}
.rcKnowledgeBack {
  display: none;
  margin-bottom: 10px;
}
.rcKnowledgeDetail {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.rcKnowledgeDetail header h4 {
  margin: 2px 0;
  color: var(--dsw-alias-label-primary);
  font-size: 18px;
  line-height: 26px;
  overflow-wrap: anywhere;
}
.rcKnowledgeDetail header > span {
  color: var(--rc-blue);
  font-size: 11px;
  font-weight: 600;
}
.rcKnowledgeDetail h5 {
  margin: 0 0 6px;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
.rcKnowledgeDetail blockquote {
  margin: 4px 0 0;
  padding: 8px 10px;
  border-left: 2px solid var(--rc-border);
  color: var(--dsw-alias-label-secondary);
  white-space: pre-wrap;
}
.rcKnowledgeDefinition {
  display: grid;
  gap: 10px;
  margin: 0;
}
.rcKnowledgeDefinition > div {
  min-width: 0;
}
.rcKnowledgeDefinition dt {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.rcKnowledgeDefinition dd {
  margin: 2px 0 0;
  color: var(--dsw-alias-label-primary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.rcKnowledgeDifference > li {
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
}
.rcKnowledgeDifference > li > div {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 8px;
  margin-top: 6px;
}
.rcKnowledgeDifference pre,
.rcKnowledgeTechnical pre,
.rcKnowledgeOperation pre {
  max-height: 280px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.rcKnowledgeRollback {
  padding: 12px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
}
.rcKnowledgeRollback textarea {
  min-height: 68px;
  margin-top: 4px;
  resize: vertical;
}
.rcKnowledgeTechnical {
  border-top: 1px solid var(--rc-border);
  padding-top: 10px;
}
.rcKnowledgeTechnical > summary {
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  font-weight: 500;
}
.rcKnowledgeTechnical dl {
  display: grid;
  gap: 4px;
}
.rcKnowledgeTechnical dl > div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
}
.rcKnowledgeTechnical dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.rcKnowledgeOperation {
  padding: 12px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
}
.rcKnowledgeOperation h4 {
  margin: 0 0 4px;
}
.rcKnowledgeOperationActions {
  flex-wrap: wrap;
}
.rcExecutions {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.rcExecutionIntro,
.rcExecutionListTop,
.rcExecutionListFoot,
.rcExecutionDetailHeader,
.rcExecutionPartMeta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.rcExecutionIntro {
  align-items: center;
}
.rcExecutionIntro > div,
.rcExecutionDetailHeader > div {
  min-width: 0;
}
.rcExecutionIntro p {
  margin: 3px 0 0;
}
.rcExecutionTabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--rc-border);
}
.rcPanel .rcExecutionTabs button {
  min-height: 32px;
  padding: 4px 12px;
  border-color: transparent;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
}
.rcPanel .rcExecutionTabs button[aria-current="page"] {
  border-bottom-color: var(--rc-blue);
  background: var(--rc-blue-soft);
  color: var(--rc-blue);
}
.rcExecutionFilters {
  display: grid;
  grid-template-columns: minmax(180px, 1.5fr) repeat(3, minmax(120px, 1fr));
  gap: 8px;
  align-items: end;
  padding: 12px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--dsw-alias-bg-module-platform);
}
.rcExecutionFilters label {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcExecutionFilters input,
.rcExecutionFilters select {
  width: 100%;
  min-width: 0;
  min-height: 32px;
}
.rcExecutionFilterActions {
  display: flex;
  grid-column: 1 / -1;
  flex-wrap: wrap;
  gap: 8px;
}
.rcExecutionWorkspace {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  align-items: start;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
}
.rcExecutionResults {
  min-width: 0;
  max-height: 680px;
  overflow: auto;
  padding: 12px;
  border-right: 1px solid var(--rc-border);
  background: var(--dsw-alias-bg-module-platform);
}
.rcExecutionPageStatus p,
.rcExecutionRange {
  margin: 0 0 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcExecutionDateGroup + .rcExecutionDateGroup {
  margin-top: 14px;
}
.rcExecutionDateGroup h4 {
  margin: 0;
  padding: 5px 2px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
}
.rcExecutionList {
  display: grid;
  min-width: 0;
}
.rcPanel .rcExecutionListItem {
  display: grid;
  gap: 5px;
  width: 100%;
  min-width: 0;
  padding: 10px 8px;
  border: 0;
  border-bottom: 1px solid var(--rc-border);
  border-radius: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  text-align: left;
}
.rcPanel .rcExecutionListItem:hover,
.rcPanel .rcExecutionListItem:focus-visible,
.rcPanel .rcExecutionListItem[aria-current="true"] {
  background: var(--dsw-alias-interactive-bg-hover);
}
.rcExecutionListTop {
  align-items: baseline;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
}
.rcExecutionListTop strong {
  min-width: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.rcExecutionListTop time {
  flex: none;
  font-size: 10px;
}
.rcExecutionListSummary {
  display: -webkit-box;
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.rcExecutionListFoot {
  align-items: center;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
}
.rcExecutionListFoot span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.rcExecutionNoResults,
.rcExecutionEmpty {
  display: grid;
  min-height: 140px;
  place-content: center;
  gap: 8px;
  padding: 18px;
  border: 1px dashed var(--rc-border);
  border-radius: 8px;
  text-align: center;
}
.rcExecutionNoResults p,
.rcExecutionEmpty {
  margin: 0;
}
.rcExecutionPagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--rc-border);
}
.rcExecutionDetailPane {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 14px;
}
.rcExecutionDetailHeader {
  align-items: flex-start;
}
.rcExecutionDetailHeader h3 {
  margin: 2px 0;
  color: var(--dsw-alias-label-primary);
  font-size: 18px;
  line-height: 26px;
  overflow-wrap: anywhere;
}
.rcExecutionDetailHeader p {
  margin: 0;
}
.rcExecutionBack {
  display: none;
  flex: none;
}
.rcExecutionDetailSection {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding-top: 12px;
  border-top: 1px solid var(--rc-border);
}
.rcExecutionDetailSection h4,
.rcExecutionMaterials h4 {
  margin: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
.rcExecutionNote {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
}
.rcExecutionText {
  max-width: 100%;
  max-height: 280px;
  margin: 0;
  overflow: auto;
  padding: 9px 10px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
  background: var(--dsw-alias-markdown-code-block);
  font-family: var(--ds-font-family-code);
  font-size: 11px;
  line-height: 17px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.rcExecutionPartMeta {
  align-items: center;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.rcExecutionMaterials,
.rcExecutionTechnical {
  border-top: 1px solid var(--rc-border);
}
.rcExecutionTechnical dl {
  display: grid;
  gap: 4px;
}
.rcExecutionTechnical dl > div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 8px;
}
.rcExecutionTechnical dt {
  color: var(--dsw-alias-label-tertiary);
}
.rcExecutionTechnical dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}
.rcExecutionBusy {
  justify-self: start;
  padding: 5px 9px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
}
.rcPanel .rcSectionNav button {
  flex: 0 0 auto;
  min-height: 30px;
  padding: 4px 8px;
  border-color: transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
}
.rcPanel .rcSectionNav button:hover,
.rcPanel .rcSectionNav button:focus-visible {
  border-color: transparent;
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.rcPanel .rcSectionNav button[aria-expanded="true"] {
  border-color: color-mix(in srgb, var(--rc-blue) 20%, transparent);
  background: var(--rc-blue-soft);
  color: var(--rc-blue);
}
.rcGroup {
  display: block;
  padding: 0;
  border-bottom: 1px solid var(--rc-border);
  scroll-margin-top: 56px;
}
.rcGroupHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 14px 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  list-style: none;
}
.rcGroupHeader::-webkit-details-marker {
  display: none;
}
.rcGroupHeader:hover {
  background: color-mix(in srgb, var(--dsw-alias-interactive-bg-hover) 58%, transparent);
}
.rcGroupHeader::after {
  flex: none;
  width: 8px;
  height: 8px;
  margin: 7px 5px 0;
  border-right: 1.5px solid var(--dsw-alias-label-tertiary);
  border-bottom: 1.5px solid var(--dsw-alias-label-tertiary);
  content: "";
  transform: rotate(45deg);
  transition: transform .16s ease, margin .16s ease;
}
.rcGroup[open] > .rcGroupHeader::after {
  margin-top: 11px;
  transform: rotate(225deg);
}
.rcGroupHeading {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.rcGroupTitle {
  margin: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}
.rcGroupDescription {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.rcGroupBody {
  display: grid;
  gap: 12px;
  min-width: 0;
  margin: 0 0 20px 18px;
  padding: 0 0 0 18px;
  border-left: 2px solid var(--rc-blue-soft);
}
.rcGroupBody > section,
.rcGroupBody > fieldset {
  min-width: 0;
  margin: 0;
  padding: 15px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 48%, var(--dsw-alias-bg-layer-2));
}
.rcGroupBody > section > h3:first-child,
.rcGroupBody > section > h4:first-child {
  margin-top: 0;
}
.rcGroupBody > section > h3,
.rcGroupBody > section > h4,
.rcGroupBody > fieldset > legend {
  color: var(--dsw-alias-label-primary);
}
.rcGroupBody > section > h3 {
  margin: 0 0 7px;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}
.rcGroupBody > section > h4 {
  margin: 18px 0 7px;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}
.rcGroupBody > section > p,
.rcGroupBody > section > div > p,
.rcGroupBody > section > fieldset > p,
.rcGroupBody > fieldset > p {
  margin: 7px 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.rcGroupBody > section > p:first-of-type {
  margin-top: 0;
}
.rcGroupBody > section section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--rc-border);
}
.rcPanel fieldset {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 11px 12px;
  min-width: 0;
  margin: 13px 0 0;
  padding: 14px 0 0;
  border: 0;
  border-top: 1px solid var(--rc-border);
}
.rcPanel fieldset > legend {
  grid-column: 1 / -1;
  padding: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}
.rcPanel fieldset > p,
.rcPanel fieldset > pre,
.rcPanel fieldset > div,
.rcPanel fieldset > ul,
.rcPanel fieldset > ol,
.rcPanel fieldset > table,
.rcPanel fieldset > button,
.rcPanel fieldset > label:has(textarea),
.rcPanel fieldset > label:has(select),
.rcPanel fieldset > label:has(input[type="checkbox"]) {
  grid-column: 1 / -1;
}
.rcPanel fieldset > button {
  justify-self: start;
}
.rcPanel label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.rcPanel label:has(> input[type="checkbox"]) {
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
}
.rcPanel input:not([type="checkbox"]),
.rcPanel select,
.rcPanel textarea {
  width: 100%;
  min-width: 0;
  min-height: 34px;
  padding: 6px 9px;
  border: 1px solid var(--dsw-alias-border-l3, var(--rc-border));
  border-radius: 6px;
  outline: none;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.rcPanel textarea {
  min-height: 96px;
  resize: vertical;
}
.rcPanel input:not([type="checkbox"]):hover:not(:disabled),
.rcPanel select:hover:not(:disabled),
.rcPanel textarea:hover:not(:disabled) {
  border-color: var(--dsw-alias-border-l4, var(--rc-border));
}
.rcPanel input:not([type="checkbox"]):focus,
.rcPanel select:focus,
.rcPanel textarea:focus {
  border-color: var(--rc-blue);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--rc-blue) 18%, transparent);
}
.rcPanel input:disabled,
.rcPanel select:disabled,
.rcPanel textarea:disabled {
  background: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 72%, transparent);
  color: var(--dsw-alias-label-tertiary);
  cursor: not-allowed;
}
.rcPanel input[type="checkbox"] {
  flex: none;
  width: 15px;
  height: 15px;
  margin: 2px 0 0;
  accent-color: var(--rc-blue);
}
.rcPanel button {
  min-height: 30px;
  padding: 4px 10px;
  border: 1px solid var(--dsw-alias-border-l3, var(--rc-border));
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s, opacity .15s;
}
.rcPanel button:hover:not(:disabled),
.rcPanel button:focus-visible {
  border-color: var(--dsw-alias-border-l4, var(--rc-border));
  background: var(--dsw-alias-interactive-bg-hover);
}
.rcPanel button:focus-visible,
.rcPanel .rcSectionNav button:focus-visible,
.rcPanel summary:focus-visible {
  outline: 2px solid var(--rc-blue);
  outline-offset: 2px;
}
.rcPanel :is(input, select, textarea, a, [tabindex]):focus-visible {
  outline: 2px solid var(--rc-blue);
  outline-offset: 2px;
}
.rcPanel button:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.rcGroupBody fieldset > button:not(:disabled) {
  border-color: var(--rc-blue);
  background: var(--rc-blue);
  color: #fff;
}
.rcGroupBody fieldset > button:not(:disabled):hover {
  border-color: color-mix(in srgb, var(--rc-blue) 84%, #000);
  background: color-mix(in srgb, var(--rc-blue) 84%, #000);
}
.rcRefreshButton,
.rcFooterAction {
  background: var(--rc-blue-soft);
  border-color: color-mix(in srgb, var(--rc-blue) 22%, var(--rc-border));
  color: var(--rc-blue);
}
.rcPanel p[role="alert"],
.rcPanel p[role="status"] {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--rc-border);
  border-left-width: 3px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.rcPanel p[role="alert"] {
  border-color: color-mix(in srgb, var(--rc-danger) 22%, var(--rc-border));
  border-left-color: var(--rc-danger);
  background: color-mix(in srgb, var(--rc-danger) 7%, transparent);
  color: var(--rc-danger);
}
.rcPanel p[role="status"] {
  border-color: color-mix(in srgb, var(--rc-blue) 20%, var(--rc-border));
  border-left-color: var(--rc-blue);
  background: var(--rc-blue-soft);
  color: var(--dsw-alias-label-secondary);
}
.rcPending {
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--rc-warning) 28%, var(--rc-border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--rc-warning) 8%, transparent);
}
.rcPending > p:first-child {
  margin-top: 0;
}
.rcPending > p:last-child {
  margin-bottom: 0;
}
.rcPending button {
  margin: 4px 6px 0 0;
}
.rcPanel ul,
.rcPanel ol {
  display: grid;
  gap: 0;
  margin: 10px 0;
  padding: 0;
  list-style: none;
}
.rcPanel li {
  min-width: 0;
  padding: 9px 0;
  border-top: 1px solid var(--rc-border);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.rcPanel li:last-child {
  border-bottom: 1px solid var(--rc-border);
}
.rcPanel li p {
  margin: 4px 0;
}
.rcPanel li button {
  margin-top: 5px;
  margin-right: 5px;
}
.rcRecordDetail {
  min-width: 0;
  margin: 10px 0 2px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--rc-blue) 20%, var(--rc-border));
  border-left: 3px solid var(--rc-blue);
  border-radius: 6px;
  background: color-mix(in srgb, var(--rc-blue) 5%, var(--dsw-alias-bg-layer-2));
  outline: none;
  scroll-margin-block: 12px;
}
.rcRecordDetail > p:first-child {
  margin-top: 0;
}
.rcRecordDetail > p:last-child {
  margin-bottom: 0;
}
.rcPanel pre {
  max-width: 100%;
  max-height: 320px;
  margin: 10px 0;
  overflow: auto;
  padding: 10px 12px;
  border: 1px solid var(--rc-border);
  border-radius: 6px;
  background: var(--dsw-alias-markdown-code-block);
  color: var(--dsw-alias-label-secondary);
  font-family: var(--ds-font-family-code);
  font-size: 11px;
  line-height: 17px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.rcPanel table {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 10px 0;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 18px;
}
.rcPanel th,
.rcPanel td {
  padding: 7px 9px;
  border-bottom: 1px solid var(--rc-border);
  text-align: left;
  white-space: nowrap;
}
.rcPanel th {
  color: var(--dsw-alias-label-tertiary);
  font-weight: 500;
}
.rcPanel details:not(.rcTechnical):not(.rcLibraryMenu) {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--rc-border);
}
.rcPanel details:not(.rcTechnical):not(.rcLibraryMenu) > summary {
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
}
.rcGroupBody > section > button {
  margin-top: 9px;
  margin-right: 5px;
}
.rcPanel a {
  color: var(--dsw-alias-link);
}
.rcPanel strong {
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.rcPanel hr {
  height: 1px;
  margin: 14px 0;
  border: 0;
  background: var(--rc-border);
}
.rcFooterAction {
  align-self: flex-start;
  margin-top: 2px;
}
.rcLoading {
  display: grid;
  gap: 12px;
  min-height: 140px;
  place-content: center;
  text-align: center;
}
.rcLoading p {
  margin: 0;
}
@media (prefers-reduced-motion: reduce) {
  .rcPanel *,
  .rcPanel *::before,
  .rcPanel *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
@container (max-width: 760px) {
  .rcExecutionFilters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rcExecutionWorkspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcExecutionResults {
    max-height: none;
    border-right: 0;
  }
  .rcExecutionWorkspace[data-detail="open"] .rcExecutionResults,
  .rcExecutionWorkspace[data-detail="closed"] .rcExecutionDetailPane {
    display: none;
  }
  .rcExecutionBack {
    display: inline-flex;
  }
  .rcKnowledgeFilters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rcKnowledgeLayout {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcKnowledgeListPanel {
    border-right: 0;
  }
  .rcKnowledgeLayout[data-detail-open="true"] .rcKnowledgeListPanel,
  .rcKnowledgeLayout:not([data-detail-open="true"]) .rcKnowledgeDetailPanel {
    display: none;
  }
  .rcKnowledgeBack {
    display: inline-flex;
  }
  .rcKnowledgeRecords {
    max-height: none;
  }
}
@container (max-width: 640px) {
  .rcHeader {
    flex-direction: column;
  }
  .rcRefreshButton {
    margin-top: 0;
  }
  .rcHeaderActions {
    justify-content: flex-start;
    margin-top: 0;
  }
  .rcGroupHeader {
    padding-right: 2px;
    padding-left: 2px;
  }
  .rcGroupBody {
    margin-left: 0;
    padding-left: 0;
    border-left: 0;
  }
  .rcTechnicalBody dl {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
  .rcTechnicalBody dd {
    margin-bottom: 7px;
  }
}
@container (max-width: 520px) {
  .rcLibraryFullNav {
    display: none;
  }
  .rcLibraryMenu {
    display: block;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .rcPanel .rcLibraryMenuOptions button {
    width: 100%;
    padding-inline: 4px;
  }
  .rcExecutionIntro {
    display: grid;
  }
  .rcExecutionFilters {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcExecutionFilterActions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .rcExecutionDetailHeader {
    display: grid;
  }
  .rcExecutionTechnical dl > div {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcExecutionPagination {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .rcMetrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .rcMetric:last-child {
    grid-column: span 2;
  }
  .rcLibraryFacts {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcKnowledgeFilters {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcKnowledgeHeading {
    display: grid;
  }
  .rcKnowledgeDifference > li > div {
    grid-template-columns: minmax(0, 1fr);
  }
}
@container (max-width: 360px) {
  .rcUpdateFacts {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcMetrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`;

export function installRoleCompanionStyles(): void {
    if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${styleId}"]`)) return;
    const tag = document.createElement('style');
    tag.dataset.plugin = 'dsh-role-companion';
    tag.dataset.pluginCss = styleId;
    tag.textContent = css;
    document.head.appendChild(tag);
}
