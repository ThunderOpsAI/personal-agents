import { NextResponse } from "next/server";
import { getPainLogsFromDb } from "../../../../../lib/db";

export async function GET() {
  try {
    const logs = await getPainLogsFromDb();

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        status: "success",
        total_logs: 0,
        average_score: 0,
        min_score: 0,
        max_score: 0,
        daily_trends: [],
        anatomical_distribution: {},
        time_of_day_distribution: [],
        recent_logs: []
      });
    }

    // Sort ascending by date
    const sorted = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

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

    sorted.forEach((log) => {
      const score = Number(log.score);
      totalScore += score;
      if (score < minScore) minScore = score;
      if (score > maxScore) maxScore = score;

      // Daily grouping
      const dateKey = new Date(log.created_at).toLocaleDateString("en-AU", { month: "short", day: "numeric", timeZone: "Australia/Melbourne" });
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

      // Time of day
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
    Object.values(anatomicalWeights).forEach(w => totalAnatomicalWeight += w);
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

    return NextResponse.json({
      status: "success",
      total_logs: sorted.length,
      average_score: averageScore,
      min_score: minScore,
      max_score: maxScore,
      daily_trends: dailyTrends,
      anatomical_distribution: anatomicalDistribution,
      time_of_day_distribution: timeOfDayDistribution,
      recent_logs: sorted.slice(-20).reverse()
    });
  } catch (error: any) {
    console.error("[Pain Analytics Error]:", error);
    return NextResponse.json({ status: "error", error: "Failed to generate pain analytics" }, { status: 500 });
  }
}
