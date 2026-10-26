// Source tabs (Google, Facebook, Referral, CP Lead, Combined View, Socials).
class SourceTabs extends React.Component {
  render() {
    const { value, onChange } = this.props;
    return (
      <nav className="tabs" role="tablist" aria-label="Lead source">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={value === s.key}
            className={value === s.key ? "tab is-active" : "tab"}
            onClick={() => onChange(s.key)}
          >
            {s.label}
          </button>
        ))}
      </nav>
    );
  }
}

class KpiTile extends React.Component {
  render() {
    const { label, value, title, hint, primary } = this.props;
    return (
      <div className={primary ? "kpi kpi-primary" : "kpi"}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value" title={title}>{value}</div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </div>
    );
  }
}

// Headline KPIs (budget → leads → meetings) and the lead-quality row below them.
// In the meeting view (`meetingView`) there are no lead counts, so Leads and Cost/Lead are left out.
class KpiTiles extends React.Component {
  render() {
    const m = this.props.metrics;
    const meetingView = this.props.meetingView;
    const v = (x, fmt) => (m ? fmt(x) : "–");
    const money = (x) => v(x, formatRupees);
    return (
      <section className="kpis" aria-label="Key metrics">
        <div className={meetingView ? "kpi-row kpi-row-primary kpi-row-3" : "kpi-row kpi-row-primary"}>
          <KpiTile primary label="Budget" value={money(m && m.spend)} hint="incl. GST" />
          {!meetingView && <KpiTile primary label="Leads" value={v(m && m.leads, formatCount)} />}
          {!meetingView && <KpiTile primary label="Cost/Lead" value={money(m && m.cpl)} />}
          <KpiTile primary label="Meetings Done" value={v(m && m.meetings, formatCount)} />
          <KpiTile primary label="Cost/Meeting" value={money(m && m.cpm)} />
        </div>
        <div className="kpi-row">
          <KpiTile label="Qualified" value={v(m && m.qualified, formatCount)} />
          <KpiTile label="Future Qualified" value={v(m && m.futureQualified, formatCount)} />
          <KpiTile label="Cost/Qualified" value={money(m && m.cpq)} />
          <KpiTile label="Cost/(FQ + QF)" value={money(m && m.cqf)} />
          <KpiTile label="Conversions" value={v(m && m.conversions, formatCount)} />
          <KpiTile label="Cost/Conversion" value={money(m && m.cpc)} />
        </div>
      </section>
    );
  }
}
