// Spend, leads and costs per source, with an inline bar for each source's share of spend.
// `meetingView` leaves out the lead columns (the Check Meetings view has no lead counts).
class SourceTable extends React.Component {
  render() {
    const { rows, meetingView } = this.props;
    const maxSpend = Math.max(1, ...rows.map((r) => r.spend));
    return (
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">By source</h3>
            <p className="card-subtitle">{meetingView ? "Budget, meetings and cost for each source" : "Budget, leads and cost for each source"}</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th className="num">Budget</th>
                {!meetingView && <th className="num">Leads</th>}
                {!meetingView && <th className="num">Cost/Lead</th>}
                <th className="num">Meetings Done</th>
                <th className="num">Qualified</th>
                <th className="num">Cost/Qualified</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="num">
                    <div className="bar-cell">
                      <span className="bar-track">
                        <span className="bar-fill" style={{ width: `${(r.spend / maxSpend) * 100}%` }} />
                      </span>
                      <span>{formatRupees(r.spend)}</span>
                    </div>
                  </td>
                  {!meetingView && <td className="num">{formatCount(r.leads)}</td>}
                  {!meetingView && <td className="num">{formatRupees(r.cpl)}</td>}
                  <td className="num">{formatCount(r.meetings)}</td>
                  <td className="num">{formatCount(r.qualified)}</td>
                  <td className="num">{formatRupees(r.cpq)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

// Period-by-period numbers behind the charts, newest first, with a totals row.
class PeriodTable extends React.Component {
  render() {
    const { series, metrics, interval, meetingView } = this.props;
    const noSpend = Boolean(metrics && metrics.noSpend);
    const money = (spend, n) => (noSpend ? "–" : formatRupees(ratio(spend, n)));
    const n = series.labels.length;
    const rows = [];
    for (let i = n - 1; i >= 0; i--) {
      rows.push({
        label: series.labels[i],
        spend: series.spend[i],
        leads: series.leads[i],
        meetings: series.meetings[i],
        qualified: series.qualified[i],
        conversions: series.conversions[i],
      });
    }
    const unit = interval === "monthly" ? "Month" : interval === "weekly" ? "Week" : "Day";
    return (
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">{unit}-by-{unit.toLowerCase()} detail</h3>
            <p className="card-subtitle">Newest first</p>
          </div>
        </div>
        <div className="table-wrap table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{unit}</th>
                <th className="num">Budget</th>
                {!meetingView && <th className="num">Leads</th>}
                {!meetingView && <th className="num">Cost/Lead</th>}
                <th className="num">Meetings Done</th>
                <th className="num">Cost/Meeting</th>
                <th className="num">Qualified</th>
                <th className="num">Cost/Qualified</th>
                <th className="num">Conversions</th>
                <th className="num">Cost/Conversion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.label}</td>
                  <td className="num">{noSpend ? "–" : formatRupees(r.spend)}</td>
                  {!meetingView && <td className="num">{formatCount(r.leads)}</td>}
                  {!meetingView && <td className="num">{money(r.spend, r.leads)}</td>}
                  <td className="num">{formatCount(r.meetings)}</td>
                  <td className="num">{money(r.spend, r.meetings)}</td>
                  <td className="num">{formatCount(r.qualified)}</td>
                  <td className="num">{money(r.spend, r.qualified)}</td>
                  <td className="num">{formatCount(r.conversions)}</td>
                  <td className="num">{money(r.spend, r.conversions)}</td>
                </tr>
              ))}
            </tbody>
            {metrics && (
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="num">{formatRupees(metrics.spend)}</td>
                  {!meetingView && <td className="num">{formatCount(metrics.leads)}</td>}
                  {!meetingView && <td className="num">{formatRupees(metrics.cpl)}</td>}
                  <td className="num">{formatCount(metrics.meetings)}</td>
                  <td className="num">{formatRupees(metrics.cpm)}</td>
                  <td className="num">{formatCount(metrics.qualified)}</td>
                  <td className="num">{formatRupees(metrics.cpq)}</td>
                  <td className="num">{formatCount(metrics.conversions)}</td>
                  <td className="num">{formatRupees(metrics.cpc)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  }
}
