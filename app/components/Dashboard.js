// Marketing Dashboard: holds the filters and the loaded data, renders everything below.
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.requestCounter = 0;
    this.abortController = null;
    this.lastRequest = null;
    const [startDate, endDate] = presetRange("today");
    this.state = {
      datePreset: "today",
      startDate,
      endDate,
      meetingPreset: "none",
      mStartDate: null,
      mEndDate: null,
      leadPresetBeforeMeetings: "today", // restored when Check Meetings is cleared
      city: "",
      cities: DEFAULT_CITIES,
      citySettingsUrl: null,
      page: "comparison", // Combined View, as before
      interval: "daily",
      data: null,
      loading: true,
      error: null,
      warnings: [],
      loadedRange: null,
      dataAsOf: null,
    };
  }

  componentDidMount() {
    this.loadData(this.currentRequest());
    fetchConfig().then((config) => {
      if (!config) return;
      this.setState({
        ...(config.cities ? { cities: config.cities } : {}),
        citySettingsUrl: config.citySettingsUrl,
      });
    });
  }

  componentWillUnmount() {
    if (this.abortController) this.abortController.abort();
  }

  // Lead Date Range and Check Meetings are either/or: a meeting range switches the dashboard to
  // meeting done dates (no lead counts); a lead range switches it back.
  currentRequest(overrides = {}) {
    const s = { ...this.state, ...overrides };
    if (s.meetingPreset !== "none" && s.mStartDate && s.mEndDate) {
      return { by: "meeting", startDate: s.mStartDate, endDate: s.mEndDate, city: s.city };
    }
    return { by: "lead", startDate: s.startDate, endDate: s.endDate, city: s.city };
  }

  // ---------- filter handlers ----------

  handleDateChange = (preset, start, end) => {
    if (preset === "none") return; // "Not used" is only shown while Check Meetings is set
    if (!start) {
      this.setState({ datePreset: preset }); // "custom" chosen: wait for Apply
      return;
    }
    // A lead range ends the meeting view.
    const next = { datePreset: preset, startDate: start, endDate: end, meetingPreset: "none", mStartDate: null, mEndDate: null };
    this.setState(next);
    this.loadData(this.currentRequest(next));
  };

  handleMeetingChange = (preset, start, end) => {
    const s = this.state;
    if (preset === "custom" && !start) {
      this.setState({ meetingPreset: preset }); // wait for Apply
      return;
    }
    let next;
    if (preset === "none") {
      // Back to the lead view with the lead range used before.
      next = { meetingPreset: "none", mStartDate: null, mEndDate: null };
      if (s.datePreset === "none") {
        const range = presetRange(s.leadPresetBeforeMeetings);
        next.datePreset = range ? s.leadPresetBeforeMeetings : "custom";
        if (range) [next.startDate, next.endDate] = range;
      }
    } else {
      next = {
        meetingPreset: preset,
        mStartDate: start,
        mEndDate: end,
        datePreset: "none",
        leadPresetBeforeMeetings: s.datePreset !== "none" ? s.datePreset : s.leadPresetBeforeMeetings,
      };
    }
    this.setState(next);
    this.loadData(this.currentRequest(next));
  };

  // Per-filter Clear links: Lead Date Range back to Today, Check Meetings back to none.
  clearLeadRange = () => {
    const [start, end] = presetRange("today");
    this.handleDateChange("today", start, end);
  };

  clearMeetings = () => this.handleMeetingChange("none", null, null);

  // Back to the starting filters: leads created today, no meeting range, all cities.
  clearFilters = () => {
    const [startDate, endDate] = presetRange("today");
    const next = {
      datePreset: "today", startDate, endDate,
      meetingPreset: "none", mStartDate: null, mEndDate: null,
      leadPresetBeforeMeetings: "today",
      city: "",
    };
    this.setState(next);
    this.loadData(this.currentRequest(next));
  };

  handleCityChange = (city) => {
    this.setState({ city });
    this.loadData(this.currentRequest({ city }));
  };

  refresh = () => {
    if (this.lastRequest) this.loadData(this.lastRequest);
  };

  // Only the most recent selection may update the screen: older in-flight requests are
  // aborted and their results ignored, and a failed request clears the numbers instead of
  // leaving the previous range's data visible. A timeout is retried once.
  loadData = async (request, isRetry = false) => {
    const requestId = ++this.requestCounter;
    this.lastRequest = request;
    if (this.abortController) this.abortController.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    this.setState({ loading: true, error: null, warnings: [] });

    try {
      const data = await fetchDashboard(request, controller.signal);
      if (requestId !== this.requestCounter) return;
      const errors = (data.meta && data.meta.errors) || {};
      this.setState({
        data,
        loading: false,
        loadedRange: request,
        dataAsOf: data.meta ? data.meta.leadsAsOf : null,
        warnings: Object.values(errors),
      });
    } catch (e) {
      if (requestId !== this.requestCounter) return;
      if (!isRetry && (e.name === "AbortError" || e.isTimeout)) {
        clearTimeout(timer);
        this.loadData(request, true);
        return;
      }
      const message = e.name === "AbortError" ? "The server took too long to respond." : e.message || "Request failed.";
      this.setState({
        data: null,
        loading: false,
        loadedRange: null,
        dataAsOf: null,
        error: `Couldn't load data for ${describeRange(request)}. ${message}`,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  render() {
    const s = this.state;
    // Layout follows the data on screen: a meeting-date response has no lead counts.
    const meetingView = Boolean(s.loadedRange && s.loadedRange.by === "meeting");
    const metrics = s.data ? computeMetrics(s.data, s.page) : null;
    const series = s.data ? computeSeries(s.data, s.page, s.interval) : null;
    const breakdown = s.data && (s.page === "comparison" || s.page === "socials") ? sourceBreakdown(s.data, s.page) : null;
    const sourceLabel = SOURCES.find((x) => x.key === s.page).label;
    const empty = { labels: [], spend: [], leads: [], meetings: [], qualified: [], cpl: [] };
    const sr = series || empty;

    return (
      <div className="app">
        <header className="topbar">
          <div>
            <h1 className="app-title">Marketing Dashboard</h1>
            <p className="app-subtitle">
              {s.loadedRange ? describeRange(s.loadedRange) : s.loading ? "Loading…" : "No data loaded"}
            </p>
          </div>
          <div className="topbar-right">
            {s.dataAsOf && <span className="as-of">Leads updated {formatAsOf(s.dataAsOf)}</span>}
            <button className="btn" onClick={this.refresh} disabled={s.loading}>
              {s.loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </header>

        <FilterBar
          datePreset={s.datePreset}
          startDate={s.startDate}
          endDate={s.endDate}
          meetingPreset={s.meetingPreset}
          mStartDate={s.mStartDate}
          mEndDate={s.mEndDate}
          city={s.city}
          cities={s.cities}
          citySettingsUrl={s.citySettingsUrl}
          interval={s.interval}
          onDateChange={this.handleDateChange}
          onMeetingChange={this.handleMeetingChange}
          onCityChange={this.handleCityChange}
          onIntervalChange={(interval) => this.setState({ interval })}
          onClear={this.clearFilters}
          onClearLead={this.clearLeadRange}
          onClearMeetings={this.clearMeetings}
        />

        <SourceTabs value={s.page} onChange={(page) => this.setState({ page })} />

        <StatusBar error={s.error} warnings={s.warnings} onRetry={this.refresh} />

        <main className={s.loading && s.data ? "content is-refreshing" : "content"} aria-busy={s.loading}>
          <KpiTiles metrics={metrics} meetingView={meetingView} />

          <div className="grid-2">
            <TrendChart
              title="Budget over time"
              subtitle={`${sourceLabel} · incl. GST`}
              kind="bar"
              format="money"
              labels={sr.labels}
              series={[{ label: "Budget", data: sr.spend, colorVar: "--series-1" }]}
            />
            <TrendChart
              title={meetingView ? "Meetings Done and Qualified" : "Leads, Meetings Done and Qualified"}
              subtitle={meetingView ? `${sourceLabel} · by meeting date` : sourceLabel}
              kind="line"
              format="count"
              labels={sr.labels}
              series={[
                ...(meetingView ? [] : [{ label: "Leads", data: sr.leads, colorVar: "--series-1" }]),
                { label: "Meetings Done", data: sr.meetings, colorVar: "--series-2" },
                { label: "Qualified", data: sr.qualified, colorVar: "--series-3" },
              ]}
            />
          </div>

          <div className={breakdown ? "grid-2" : "grid-1"}>
            {meetingView ? (
              <TrendChart
                title="Cost/Meeting over time"
                subtitle={`${sourceLabel} · budget ÷ meetings done`}
                kind="line"
                format="money"
                labels={sr.labels}
                series={[{ label: "Cost/Meeting", data: sr.spend.map((v, i) => ratio(v, sr.meetings[i])), colorVar: "--series-1" }]}
              />
            ) : (
              <TrendChart
                title="Cost/Lead over time"
                subtitle={`${sourceLabel} · budget ÷ leads`}
                kind="line"
                format="money"
                labels={sr.labels}
                series={[{ label: "Cost/Lead", data: sr.cpl, colorVar: "--series-1" }]}
              />
            )}
            {breakdown && <SourceTable rows={breakdown} meetingView={meetingView} />}
          </div>

          {series && <PeriodTable series={series} metrics={metrics} interval={s.interval} meetingView={meetingView} />}

          {!s.data && s.loading && <div className="loading-note">Loading data…</div>}
        </main>

        <footer className="footer">Budget includes 18% GST · Data from Google Ads, Meta Ads and Zoho CRM</footer>
      </div>
    );
  }
}
