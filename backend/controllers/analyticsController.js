import Session from "../models/Session.js";

// Convert Gemini recommendation text into short labels
function shortLabel(rec) {
  if (!rec) return "Unknown";

  const text = rec.toLowerCase();

  if (text.includes("strong hire") || text.includes("strong")) {
    return "Strong Hire";
  }

  if (
    text.includes("good candidate") ||
    text.includes("recommended for interview") ||
    text.includes("interview")
  ) {
    return "Interview";
  }

  if (text.includes("not a fit") || text.includes("not fit")) {
    return "Not a Fit";
  }

  if (text.includes("no hire")) {
    return "No Hire";
  }

  if (text.includes("reject")) {
    return "Reject";
  }

  if (text.includes("review manually") || text.includes("manual")) {
    return "Review Manually";
  }

  // Fallback: truncate long text
  return rec.length > 20 ? rec.slice(0, 20) + "..." : rec;
}

export async function getAnalytics(req, res, next) {
  try {
    const sessions = await Session.find({ userId: req.user.id });

    const allResumes = sessions.flatMap((s) => s.resumes);

    if (!allResumes.length) {
      return res.json({ empty: true });
    }

    // Total counts
    const totalResumes = allResumes.length;
    const totalSessions = sessions.length;

    // Average score
    const scores = allResumes
      .map((r) => r.screening?.score)
      .filter((s) => typeof s === "number");

    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Score distribution
    const scoreDist = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];

    scores.forEach((s) => {
      if (s <= 20) scoreDist[0].count++;
      else if (s <= 40) scoreDist[1].count++;
      else if (s <= 60) scoreDist[2].count++;
      else if (s <= 80) scoreDist[3].count++;
      else scoreDist[4].count++;
    });

    // Recommendation breakdown
    const recMap = {};

    allResumes.forEach((r) => {
      const rec = shortLabel(r.screening?.recommendation);
      recMap[rec] = (recMap[rec] || 0) + 1;
    });

    const recommendations = Object.entries(recMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Top Skills
    const skillMap = {};

    allResumes.forEach((r) => {
      r.screening?.topSkills?.forEach((skill) => {
        if (skill) {
          skillMap[skill] = (skillMap[skill] || 0) + 1;
        }
      });
    });

    const topSkills = Object.entries(skillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        count,
      }));

    // Average score per session
    const sessionScores = sessions
      .map((s) => ({
        title: s.title || "Untitled",
        avgScore: s.resumes.length
          ? Math.round(
              s.resumes.reduce((a, r) => a + (r.screening?.score || 0), 0) /
                s.resumes.length,
            )
          : 0,
        count: s.resumes.length,
      }))
      .filter((s) => s.count > 0);

    res.json({
      totalResumes,
      totalSessions,
      avgScore,
      scoreDist,
      recommendations,
      topSkills,
      sessionScores,
    });
  } catch (err) {
    next(err);
  }
}
