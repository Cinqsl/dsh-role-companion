export const sourceLibraryStyles=`
.rcSourcesLibrary {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.rcSourcesIntroduction {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.rcSourcesIntroduction h3,
.rcSourcesIntroduction p {
  margin-top: 0;
}
.rcSourcesRevision {
  flex: none;
  margin-top: 3px;
  color: var(--dsw-alias-label-tertiary);
}
.rcSourceFilters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  align-items: end;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--dsw-alias-bg-module-platform);
}
.rcSourceFilters > label:first-child {
  grid-column: span 2;
}
.rcSourceFilters label {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.rcSourceFilters input,
.rcSourceFilters select {
  width: 100%;
  min-width: 0;
  min-height: 32px;
}
.rcSourceFilters > button {
  min-height: 32px;
  white-space: nowrap;
}
.rcSourceChips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rcSourceChips button {
  max-width: 100%;
  min-height: 26px;
  overflow: hidden;
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rcSourceRange {
  margin: 0;
}
.rcSourcesWorkspace {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  min-width: 0;
}
.rcSourceIndex {
  min-width: 0;
}
.rcSourceDateGroup + .rcSourceDateGroup {
  margin-top: 16px;
}
.rcSourceDateGroup h4 {
  margin: 0;
  padding: 6px 2px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
}
.rcSourceDateGroup ol {
  margin: 0;
  border-top: 1px solid var(--rc-border);
}
.rcSourceDateGroup li {
  padding: 0;
  border-top: 0;
}
.rcSourceRow {
  display: grid;
  width: 100%;
  gap: 5px;
  padding: 10px 8px;
  border: 0;
  border-bottom: 1px solid var(--rc-border);
  border-radius: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  text-align: left;
}
.rcSourceRow:hover,
.rcSourceRow:focus-visible,
.rcSourceRow[aria-current="true"] {
  background: var(--dsw-alias-interactive-bg-hover);
}
.rcSourceRowMeta,
.rcSourceStatuses {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 8px;
}
.rcSourceRowMeta strong {
  font-size: 12px;
}
.rcSourceRowMeta time {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.rcSourcePreview {
  display: -webkit-box;
  overflow: hidden;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.rcSourceStatuses span {
  padding: 1px 5px;
  border: 1px solid var(--rc-border);
  border-radius: 4px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  line-height: 16px;
}
.rcSourceDetail {
  position: sticky;
  top: 58px;
  min-width: 0;
  margin: 0;
  padding: 16px;
}
.rcSourceDetailPlaceholder {
  display: grid;
  min-height: 132px;
  place-content: center;
  border: 1px dashed var(--rc-border);
  border-left: 1px dashed var(--rc-border);
  background: var(--dsw-alias-bg-module-platform);
  text-align: center;
}
.rcSourceDetailPlaceholder p {
  margin: 0;
}
.rcSourceDetail h3 {
  margin-bottom: 2px;
}
.rcSourceDetailHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.rcSourceBack {
  display: none;
}
.rcSourceDetailTime {
  margin: 0 0 14px;
  color: var(--dsw-alias-label-tertiary) !important;
}
.rcSourceBody pre {
  max-height: 420px;
  margin-top: 0;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-primary);
  font-family: var(--dsw-font-family);
  font-size: 13px;
  line-height: 22px;
  white-space: pre-wrap;
}
.rcSourceBody > p {
  margin: 0 0 8px;
}
.rcSourceConflict {
  display: grid;
  gap: 8px;
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--rc-warning) 28%, var(--rc-border));
  border-radius: 6px;
  background: color-mix(in srgb, var(--rc-warning) 8%, transparent);
}
.rcSourceConflict strong {
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
}
.rcSourceConflict button {
  justify-self: start;
}
.rcSourceRelations {
  margin-top: 16px;
}
.rcSourceRelations h4 {
  margin: 0 0 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
}
.rcSourceRelations ul {
  margin: 0 0 12px;
}
.rcSourceRelations li {
  padding: 5px 0;
  border-top: 0;
}
.rcSourcesEmpty {
  display: grid;
  justify-items: start;
  gap: 6px;
  min-height: 150px;
  align-content: center;
  padding: 20px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--dsw-alias-bg-module-platform);
}
.rcSourcesEmpty p {
  margin: 0;
}
.rcSourcePager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 4px;
}
.rcSourcePager span {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
@container (max-width: 760px) {
  .rcSourceFilters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rcSourceFilters > label:first-child,
  .rcSourceFilters > button {
    grid-column: 1 / -1;
  }
  .rcSourcesWorkspace.is-detail-open {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcSourcesWorkspace.is-detail-open .rcSourceIndex {
    display: none;
  }
  .rcSourcesLibrary[data-detail-open="true"] .rcSourceFilters,
  .rcSourcesLibrary[data-detail-open="true"] .rcSourceChips,
  .rcSourcesLibrary[data-detail-open="true"] .rcSourceRange,
  .rcSourcesLibrary[data-detail-open="true"] .rcSourcePager {
    display: none;
  }
  .rcSourceDetailPlaceholder {
    display: none;
  }
  .rcSourceDetail {
    position: static;
  }
  .rcSourceBack {
    display: inline-flex;
  }
}
@container (max-width: 520px) {
  .rcSourceFilters {
    grid-template-columns: minmax(0, 1fr);
  }
  .rcSourceFilters > label:first-child,
  .rcSourceFilters > button {
    grid-column: auto;
  }
  .rcSourcesIntroduction {
    display: grid;
  }
  .rcSourcePager {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .rcSourcePager span {
    grid-column: 1 / -1;
    grid-row: 1;
    text-align: center;
  }
}
`;
