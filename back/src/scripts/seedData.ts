import { supabaseService } from "../services/supabaseService.js";

async function seedData() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Create accounts
    console.log("Creating accounts...");
    const accounts = await Promise.all([
      supabaseService.createAccount({
        name: "Operating Checking",
        bank: "Chase",
        currency: "USD",
        balance: 750000,
        account_type: "checking",
      }),
      supabaseService.createAccount({
        name: "High-Yield Savings",
        bank: "Marcus by Goldman Sachs",
        currency: "USD",
        balance: 500000,
        account_type: "high_yield",
      }),
      supabaseService.createAccount({
        name: "Money Market Fund",
        bank: "Fidelity",
        currency: "USD",
        balance: 300000,
        account_type: "money_market",
      }),
      supabaseService.createAccount({
        name: "Reserve Account",
        bank: "Wells Fargo",
        currency: "USD",
        balance: 450000,
        account_type: "reserve",
      }),
      supabaseService.createAccount({
        name: "EUR Operating Account",
        bank: "Deutsche Bank",
        currency: "EUR",
        balance: 400000,
        account_type: "checking",
      }),
      supabaseService.createAccount({
        name: "GBP Savings",
        bank: "Barclays",
        currency: "GBP",
        balance: 250000,
        account_type: "savings",
      }),
    ]);
    console.log(`✓ Created ${accounts.length} accounts\n`);

    // Create 30-day forecast
    console.log("Creating 30-day forecast...");
    const today = new Date();
    const forecastData = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Generate realistic inflows and outflows with some variation
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const baseInflow = isWeekend ? 20000 : 55000;
      const baseOutflow = isWeekend ? 15000 : 42000;

      const inflow = baseInflow + (Math.random() * 20000 - 10000);
      const outflow = baseOutflow + (Math.random() * 15000 - 7500);

      forecastData.push({
        date: date.toISOString().split("T")[0],
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
        description: isWeekend ? "Weekend" : `Business day ${i + 1}`,
      });
    }

    await Promise.all(
      forecastData.map((f) => supabaseService.createForecast(f))
    );
    console.log(`✓ Created 30-day forecast\n`);

    // Create treasury policy
    console.log("Creating treasury policy...");
    const policy = await supabaseService.createPolicy({
      name: "Standard Treasury Policy",
      min_liquidity: 150000,
      invest_above: 75000,
      risk_profile: "balanced",
      description:
        "Balanced approach to liquidity management and yield optimization",
      is_active: true,
    });
    console.log(`✓ Created policy: ${policy.name}\n`);

    // Summary
    console.log("📊 Database seeding completed!\n");
    console.log("Summary:");
    console.log(`  - ${accounts.length} bank accounts`);
    console.log(`  - 30-day cash flow forecast`);
    console.log(`  - 1 active treasury policy`);
    console.log(
      `  - Total cash: $${accounts
        .reduce((sum, acc) => {
          // Convert to USD for total (simplified)
          return sum + acc.balance;
        }, 0)
        .toLocaleString()}`
    );
    console.log("\n✅ Ready for simulation!\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedData };
