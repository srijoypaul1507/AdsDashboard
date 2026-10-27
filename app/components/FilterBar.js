// A date-range picker: preset list plus a custom From/To range.
// `allowNone` adds a first option that clears the range (used by the meeting-date filter).
// `onClear` (when set) shows a "Clear" link next to the label while hovering the filter.
class DateRangeControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { from: "", to: "" };
  }

  handlePreset = (event) => {
    const key = event.target.value;
    if (key === "custom") {
      const [from, to] = presetRange("last7");
      this.setState({ from: this.props.start || from, to: this.props.end || to });
      this.props.onChange(key, null, null);
      return;
    }
    if (key === "none") {
      this.props.onChange(key, null, null);
      return;
    }
    const [start, end] = presetRange(key);
    this.props.onChange(key, start, end);
  };

  applyCustom = () => {
    const { from, to } = this.state;
    if (from && to && from <= to) this.props.onChange("custom", from, to);
  };

  render() {
    const { id, label, preset, allowNone, noneLabel, onClear } = this.props;
    const { from, to } = this.state;
    const invalid = !from || !to || from > to;
    return (
      <div className={onClear ? "filter is-clearable" : "filter"}>
        <div className="filter-label-row">
          <label className="filter-label" htmlFor={id}>{label}</label>
          {onClear && (
            <button type="button" className="filter-link filter-clear-link" onClick={onClear} aria-label={`Clear ${label}`}>
              Clear
            </button>
          )}
        </div>
        <div className="filter-row">
          <select id={id} className="control" value={preset} onChange={this.handlePreset}>
            {allowNone && <option value="none">{noneLabel}</option>}
            {DATE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          {preset === "custom" && (
            <div className="custom-range">
              <input
                type="date"
                className="control"
                aria-label={`${label} from`}
                value={from}
                max={to || undefined}
                onChange={(e) => this.setState({ from: e.target.value })}
              />
              <span className="range-sep">to</span>
              <input
                type="date"
                className="control"
                aria-label={`${label} to`}
                value={to}
                min={from || undefined}
                onChange={(e) => this.setState({ to: e.target.value })}
              />
              <button className="btn btn-primary" disabled={invalid} onClick={this.applyCustom}>
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

class SegmentedControl extends React.Component {
  render() {
    const { label, options, value, onChange } = this.props;
    return (
      <div className="filter">
        <span className="filter-label">{label}</span>
        <div className="segmented" role="radiogroup" aria-label={label}>
          {options.map((o) => (
            <button
              key={o.key}
              role="radio"
              aria-checked={value === o.key}
              className={value === o.key ? "segment is-active" : "segment"}
              onClick={() => onChange(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
}

const INTERVALS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

// The single filter row that scopes everything below it.
class FilterBar extends React.Component {
  render() {
    const p = this.props;
    return (
      <div className="filter-bar">
        <DateRangeControl
          id="lead-range"
          label="Lead Date Range"
          preset={p.datePreset}
          allowNone={p.meetingPreset !== "none"}
          noneLabel="Not used"
          onClear={p.datePreset !== "today" && p.datePreset !== "none" ? p.onClearLead : null}
          start={p.startDate}
          end={p.endDate}
          onChange={p.onDateChange}
        />
        <DateRangeControl
          id="meeting-range"
          label="Check Meetings"
          preset={p.meetingPreset}
          allowNone
          noneLabel="Choose"
          start={p.mStartDate}
          end={p.mEndDate}
          onChange={p.onMeetingChange}
          onClear={p.meetingPreset !== "none" ? p.onClearMeetings : null}
        />
        <div className="filter">
          <div className="filter-label-row">
            <label className="filter-label" htmlFor="city">City</label>
            {p.citySettingsUrl && (
              <a
                className="filter-link"
                href={p.citySettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Which salesperson counts for which city, and from when (Zoho CRM, admins only)"
              >
                Settings
              </a>
            )}
          </div>
          <select id="city" className="control" value={p.city} onChange={(e) => p.onCityChange(e.target.value)}>
            <option value="">All Cities</option>
            {p.cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <SegmentedControl label="Graph Interval" options={INTERVALS} value={p.interval} onChange={p.onIntervalChange} />
        <div className="filter filter-clear">
          <button className="btn" onClick={p.onClear}>Clear filters</button>
        </div>
      </div>
    );
  }
}
