import { NextResponse } from "next/server";
import { getPainLogsFromDb } from "../../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'month').toLowerCase();

    const allLogs = await getPainLogsFromDb();

    if (!allLogs || allLogs.length === 0) {
      return NextResponse.json({
        status: "success",
        period,
        period_label: period === 'day' ? 'Today' : period === 'week' ? 'Last 7 Days' : period === 'all' ? 'All Time' : 'Last 30 Days',
        total_logs: 0,
        average_score: 0,
        min_score: 0,
        max_score: 0,
        daily_trends: [],
        intra_day_trends: [],
        anatomical_distribution: {},
        time_of_day_distribution: [],
        logs: [],
        recent_logs: []
      });
    }

    const now = new Date();
    const tz = "Australia/Melbourne";
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now); // "YYYY-MM-DD"

    // Filter logs based on period
    let filteredLogs = [...allLogs];

    if (period === 'day') {
      filteredLogs = allLogs.filter((log) => {
        const logDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(log.created_at));
        return logDateStr === todayStr;
      });
      // If no logs yet today, fallback to last 24 hours so the user sees recent context
      if (filteredLogs.length === 0) {
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filteredLogs = allLogs.filter((log) => new Date(log.created_at) >= last24h);
      }
    } else if (period === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = allLogs.filter((log) => new Date(log.created_at) >= sevenDaysAgo);
    } else if (period === 'month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredLogs = allLogs.filter((log) => new Date(log.created_at) >= thirtyDaysAgo);
    }

    if (filteredLogs.length === 0) {
      filteredLogs = allLogs.slice(0, 10);
    }

    // Sort ascending by date for chronological analytics
    const sorted = [...filteredLogs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let totalScore = 0;
    let minScore = 10;
    let maxScore = 0;

    const anatomicalWeights: Record<string, number> = {};
    const timeOfDayScores: Record<string, { total: number; count: number }> = {
      "06:00 AM (Morning)": { total: 0, count: 0 },
      "09:00 AM (Midday)": { total: 0, count: 0 },
      "02:00 PM (Afternoon)": { total: 0, count: 0 },
      "09:00 PM (Evening)": { total: 0, count: 0 },
      "Other": { total: 0, count: 0 }
    };

    const dailyMap: Record<string, { scores: number[]; count: number }> = {};
    const intraDayTrends: Array<{
      id: string;
      time: string;
      timestamp: string;
      score: number;
      primary_area: string;
      mood: string | null;
      notes: string | null;
      locations: any[];
    }> = [];

    sorted.forEach((log) => {
      const score = Number(log.score);
      totalScore += score;
      if (score < minScore) minScore = score;
      if (score > maxScore) maxScore = score;

      // Intra-day item
      const timeStr = new Date(log.created_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz });
      let primaryArea = "General";
      if (Array.isArray(log.locations) && log.locations.length > 0) {
        const topLoc = [...log.locations].sort((a: any, b: any) => (b.percentage || b.weight || 0) - (a.percentage || a.weight || 0))[0];
        primaryArea = `${topLoc.side && topLoc.side !== "unspecified" ? topLoc.side + " " : ""}${topLoc.area}`;
      }

      intraDayTrends.push({
        id: log.id,
        time: timeStr,
        timestamp: log.created_at,
        score,
        primary_area: primaryArea,
        mood: log.mood || null,
        notes: log.notes || null,
        locations: log.locations || []
      });

      // Daily grouping
      const dateKey = new Date(log.created_at).toLocaleDateString("en-AU", { month: "short", day: "numeric", timeZone: tz });
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { scores: [], count: 0 };
      dailyMap[dateKey].scores.push(score);
      dailyMap[dateKey].count++;

      // Anatomical breakdown
      if (Array.isArray(log.locations)) {
        log.locations.forEach((loc: any) => {
          const areaName = `${loc.side && loc.side !== "unspecified" ? loc.side.charAt(0).toUpperCase() + loc.side.slice(1) + " " : ""}${loc.area.charAt(0).toUpperCase() + loc.area.slice(1)}`;
          const weight = loc.percentage || loc.weight || 0;
          anatomicalWeights[areaName] = (anatomicalWeights[areaName] || 0) + weight;
        });
      }

      // Time of day classification
      const hour = new Date(log.created_at).getHours();
      if (hour >= 5 && hour <= 7) {
        timeOfDayScores["06:00 AM (Morning)"].total += score;
        timeOfDayScores["06:00 AM (Morning)"].count++;
      } else if (hour >= 8 && hour <= 11) {
        timeOfDayScores["09:00 AM (Midday)"].total += score;
        timeOfDayScores["09:00 AM (Midday)"].count++;
      } else if (hour >= 13 && hour <= 16) {
        timeOfDayScores["02:00 PM (Afternoon)"].total += score;
        timeOfDayScores["02:00 PM (Afternoon)"].count++;
      } else if (hour >= 20 && hour <= 23) {
        timeOfDayScores["09:00 PM (Evening)"].total += score;
        timeOfDayScores["09:00 PM (Evening)"].count++;
      } else {
        timeOfDayScores["Other"].total += score;
        timeOfDayScores["Other"].count++;
      }
    });

    const averageScore = Math.round((totalScore / sorted.length) * 10) / 10;

    // Normalize anatomical percentages
    let totalAnatomicalWeight = 0;
    Object.values(anatomicalWeights).forEach((w) => (totalAnatomicalWeight += w));
    const anatomicalDistribution: Record<string, number> = {};
    Object.entries(anatomicalWeights).forEach(([area, weight]) => {
      anatomicalDistribution[area] = totalAnatomicalWeight > 0 ? Math.round((weight / totalAnatomicalWeight) * 100) : 0;
    });

    // Daily trends array
    const dailyTrends = Object.entries(dailyMap).map(([date, data]) => {
      const avg = Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10;
      const peak = Math.max(...data.scores);
      return { date, avg, peak, count: data.count };
    });

    // Time of day averages
    const timeOfDayDistribution = Object.entries(timeOfDayScores)
      .filter(([_, data]) => data.count > 0)
      .map(([slot, data]) => ({
        slot,
        average: Math.round((data.total / data.count) * 10) / 10,
        count: data.count
      }));

    const periodLabel = period === 'day' ? 'Today' : period === 'week' ? 'Last 7 Days' : period === 'all' ? 'All Time' : 'Last 30 Days';

    // Clinical Doctor Synopsis synthesis
    const severeSpikes = sorted.filter(l => Number(l.score) >= 7.0).length;
    const severePercentage = sorted.length > 0 ? Math.round((severeSpikes / sorted.length) * 100) : 0;
    
    // Sort anatomical contributors
    const sortedAnatomyList = Object.entries(anatomicalDistribution).sort((a, b) => b[1] - a[1]);
    const primaryGenerator = sortedAnatomyList.length > 0 ? `${sortedAnatomyList[0][0]} (${sortedAnatomyList[0][1]}%)` : "Unspecified";
    const secondaryGenerator = sortedAnatomyList.length > 1 ? `${sortedAnatomyList[1][0]} (${sortedAnatomyList[1][1]}%)` : null;

    // Diurnal variation calculation
    const morningAvg = timeOfDayScores["06:00 AM (Morning)"].count > 0 
      ? Math.round((timeOfDayScores["06:00 AM (Morning)"].total / timeOfDayScores["06:00 AM (Morning)"].count) * 10) / 10 
      : null;
    const eveningAvg = timeOfDayScores["09:00 PM (Evening)"].count > 0 
      ? Math.round((timeOfDayScores["09:00 PM (Evening)"].total / timeOfDayScores["09:00 PM (Evening)"].count) * 10) / 10 
      : null;

    const clinicalSynopsis = {
      primary_generator: primaryGenerator,
      secondary_generator: secondaryGenerator,
      severe_flare_frequency: `${severeSpikes} logs (≥7/10, ${severePercentage}% of period)`,
      diurnal_pattern: morningAvg && eveningAvg
        ? `Morning stiffness ${morningAvg}/10 escalating to Evening load ${eveningAvg}/10 (+${Math.round((eveningAvg - morningAvg)*10)/10})`
        : "Consistent diurnal baseline",
      neurological_red_flags: [
        "Rapidly deteriorating gait / foot drop (inability to clear ground without knee lift, daily trip hazard)",
        "Provocative dural traction / sciatic shockwaves retrogradely targeting right lumbar disc",
        "Paradoxical patellar hyperreflexia co-exacerbation during acute sciatic spikes"
      ],
      surgical_context: "C5-C7 ACDF status post-op (Prof. Greg Cunningham, titanium MRI-conditional). Right L4-L5 / L5-S1 disc protrusion with radiculopathy.",
      recommended_consult_questions: [
        "Consider immediate prescription/referral for Ankle-Foot Orthosis (AFO / foot-up splint) for fall prevention",
        "Review repeat lumbar MRI vs cervical MRI to distinguish L4/L5 LMN root compression vs UMN myelomalacic progression",
        "Evaluate suitability and timing for interventional pain management / Spinal Cord Stimulation (SCS) trial"
      ]
    };

    return NextResponse.json({
      status: "success",
      period,
      period_label: periodLabel,
      total_logs: sorted.length,
      total_all_time_logs: allLogs.length,
      average_score: averageScore,
      min_score: minScore,
      max_score: maxScore,
      clinical_synopsis: clinicalSynopsis,
      daily_trends: dailyTrends,
      intra_day_trends: intraDayTrends,
      anatomical_distribution: anatomicalDistribution,
      time_of_day_distribution: timeOfDayDistribution,
      logs: [...sorted].reverse(),
      recent_logs: [...sorted].reverse().slice(0, 30)
    });
  } catch (error: any) {
    console.error("[Pain Analytics Error]:", error);
    return NextResponse.json({ status: "error", error: "Failed to generate pain analytics" }, { status: 500 });
  }
}
