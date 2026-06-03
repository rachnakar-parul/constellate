import { supabase } from "./supabase";

export async function updateAnalytics(people) {
  try {
    console.log("ANALYTICS RUNNING");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("SESSION:", session);

    if (!session?.user?.id) {
      console.log("No logged-in user, skipping analytics");
      return;
    }

    const userId = session.user.id;

    const totalEntries = people.reduce(
      (sum, p) => sum + p.entries.length,
      0
    );

    const avgEntries =
      people.length > 0
        ? totalEntries / people.length
        : 0;

    console.log("USER ID:", userId);
    console.log("PEOPLE:", people.length);
    console.log("TOTAL ENTRIES:", totalEntries);

    const { data: existing, error: selectError } = await supabase
      .from("analytics_users")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("SELECT RESULT:", existing);
    console.log("SELECT ERROR:", selectError);

    if (selectError) {
      return;
    }

    if (existing) {
      const result = await supabase
        .from("analytics_users")
        .update({
          session_count: (existing.session_count || 0) + 1,
          people_count: people.length,
          total_entries: totalEntries,
          avg_entries_per_person: avgEntries,
        })
        .eq("user_id", userId);

      console.log("UPDATE RESULT:", result);
    } else {
      const result = await supabase
        .from("analytics_users")
        .insert({
          user_id: userId,
          session_count: 1,
          people_count: people.length,
          total_entries: totalEntries,
          avg_entries_per_person: avgEntries,
        });

      console.log("INSERT RESULT:", result);
    }
  } catch (err) {
    console.error("ANALYTICS CRASH:", err);
  }
}