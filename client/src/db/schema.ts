import {
  index,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const prices = sqliteTable(
  "prices",
  {
    symbol: text("symbol").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD (UTC)
    interval: text("interval").notNull().default("1d"),
    close: real("close").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.symbol, t.date, t.interval] }),
    bySymbolDate: index("idx_prices_symbol_date").on(t.symbol, t.date),
  })
);

export const dividendYields = sqliteTable(
  "dividend_yields",
  {
    symbol: text("symbol").notNull(), // e.g. 'SPY'
    date: text("date").notNull(), // YYYY-MM-DD
    value: real("value").notNull(), // percent
  },
  (t) => ({
    pk: primaryKey({ columns: [t.symbol, t.date] }),
    bySymbolDate: index("idx_divy_symbol_date").on(t.symbol, t.date),
  })
);
