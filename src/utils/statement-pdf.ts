import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDisplayDate, toIsoDate } from "@/utils/date";
import {
    MonthStatement,
    StatementLine,
    groupStatementLinesByDate,
    toMonthParam,
} from "@/utils/month-statement";

type FormatMoneyFn = (
    amount: number,
    options?: { sign?: "+" | "−" | "" }
) => string;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function kindLabel(line: StatementLine): string {
    switch (line.kind) {
        case "income":
            return "Income";
        case "expense":
            return "Spending";
        case "bill":
            return line.skipped ? "Bill · skipped" : "Bill payment";
        case "debt":
            return line.skipped ? "Debt · skipped" : "Debt payment";
        case "savings":
            return "Savings";
    }
}

function signedMoney(
    amount: number,
    direction: "in" | "out" | "net",
    formatMoney: FormatMoneyFn
): string {
    if (direction === "in") {
        return formatMoney(amount, { sign: "+" });
    }
    if (direction === "out") {
        return formatMoney(amount, { sign: "−" });
    }
    if (amount > 0) {
        return formatMoney(amount, { sign: "+" });
    }
    if (amount < 0) {
        return formatMoney(Math.abs(amount), { sign: "−" });
    }
    return formatMoney(0);
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
}

/** Load the app icon as a data URI for HTML printing (iOS cannot use local asset URLs). */
export async function loadStatementLogoDataUri(): Promise<string | null> {
    try {
        const asset = Asset.fromModule(
            require("../../assets/images/icon.png")
        );
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        if (!uri) {
            return null;
        }
        const file = new File(uri);
        const buffer = await file.arrayBuffer();
        const base64 = bytesToBase64(new Uint8Array(buffer));
        return `data:image/png;base64,${base64}`;
    } catch {
        return null;
    }
}

export function statementPdfFileName(statement: MonthStatement): string {
    return `on-hand-statement-${toMonthParam(statement.range.start)}.pdf`;
}

export type BuildStatementHtmlOptions = {
    statement: MonthStatement;
    formatMoney: FormatMoneyFn;
    currencyCode: string;
    logoDataUri?: string | null;
    generatedAt?: Date;
};

/** Pure HTML builder — unit-tested without calling Print. */
export function buildStatementHtml(options: BuildStatementHtmlOptions): string {
    const {
        statement,
        formatMoney,
        currencyCode,
        logoDataUri = null,
        generatedAt = new Date(),
    } = options;

    const generatedLabel = formatDisplayDate(toIsoDate(generatedAt));
    const { activity } = statement;
    const dayGroups = groupStatementLinesByDate(statement.lines);

    const logoBlock = logoDataUri
        ? `<img class="logo" src="${logoDataUri}" alt="On Hand" />`
        : `<div class="logo-fallback">OH</div>`;

    const summaryRows = [
        ["Money in (income)", signedMoney(activity.income, "in", formatMoney)],
        ["Spending", signedMoney(activity.expenses, "out", formatMoney)],
        ["Bills paid", signedMoney(activity.bills, "out", formatMoney)],
        [
            "Debt payments",
            signedMoney(activity.debtPayments, "out", formatMoney),
        ],
        ["Savings", signedMoney(activity.savings, "out", formatMoney)],
        [
            "Net this month",
            signedMoney(activity.leftover, "net", formatMoney),
        ],
    ]
        .map(
            ([label, value], index) => `
      <tr class="${index === 5 ? "net-row" : ""}">
        <td>${label}</td>
        <td class="num">${escapeHtml(value)}</td>
      </tr>`
        )
        .join("");

    let transactionBody: string;
    if (dayGroups.length === 0) {
        transactionBody = `
      <tr class="empty">
        <td colspan="6">No money moved this month.</td>
      </tr>`;
    } else {
        transactionBody = dayGroups
            .map((group) => {
                const dayHeader = `
      <tr class="day-row">
        <td colspan="6">${escapeHtml(formatDisplayDate(group.date))}</td>
      </tr>`;
                const rows = group.lines
                    .map((line) => {
                        const inAmount =
                            line.direction === "in" && !line.skipped
                                ? escapeHtml(formatMoney(line.amount))
                                : "";
                        const outAmount =
                            line.direction === "out"
                                ? escapeHtml(
                                      line.skipped
                                          ? formatMoney(0)
                                          : formatMoney(line.amount)
                                  )
                                : "";
                        return `
      <tr class="txn-row">
        <td class="date-col"></td>
        <td class="desc">${escapeHtml(line.label)}</td>
        <td class="type">${escapeHtml(kindLabel(line))}</td>
        <td class="num in">${inAmount}</td>
        <td class="num out">${outAmount}</td>
        <td class="num bal">${escapeHtml(formatMoney(line.balanceAfter))}</td>
      </tr>`;
                    })
                    .join("");
                return dayHeader + rows;
            })
            .join("");
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { margin: 16mm; size: A4 portrait; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.45;
    }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 2px solid #0f172a;
    }
    .logo {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
    }
    .logo-fallback {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #0f172a;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand { flex: 1; }
    .brand-name {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.3px;
      margin: 0;
    }
    .doc-title {
      margin: 2px 0 0;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .meta {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    .meta td {
      padding: 3px 0;
      vertical-align: top;
    }
    .meta .k {
      width: 88px;
      color: #64748b;
      font-weight: 600;
    }
    .meta .v { font-weight: 600; }
    h2 {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.55px;
      text-transform: uppercase;
      color: #475569;
    }
    .balances {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .balances td {
      width: 50%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      vertical-align: top;
    }
    .balances .label {
      display: block;
      color: #64748b;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 4px;
    }
    .balances .value {
      font-size: 16px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .summary {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .summary td {
      padding: 5px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      white-space: nowrap;
    }
    .summary tr.net-row td {
      border-bottom: none;
      border-top: 1.5px solid #0f172a;
      padding-top: 8px;
      font-weight: 700;
    }
    .ledger {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .ledger thead th {
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.45px;
      color: #64748b;
      border-bottom: 1.5px solid #0f172a;
      padding: 6px 4px;
      font-weight: 700;
    }
    .ledger thead th.num { text-align: right; }
    .ledger td {
      padding: 5px 4px;
      vertical-align: top;
      border-bottom: 1px solid #f1f5f9;
    }
    .ledger tr.day-row td {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
      padding-top: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .ledger td.desc { width: 36%; }
    .ledger td.type { color: #64748b; width: 16%; }
    .ledger td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      width: 12%;
    }
    .ledger td.num.bal { font-weight: 700; }
    .ledger td.date-col { width: 10%; }
    .ledger tr.empty td {
      color: #64748b;
      padding: 12px 4px;
      border-bottom: none;
    }
    .closing {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 20px;
    }
    .closing td {
      padding: 10px 0 0;
      border-top: 2px solid #0f172a;
      font-weight: 700;
      font-size: 12px;
    }
    .closing td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .footer {
      color: #94a3b8;
      font-size: 9px;
      line-height: 1.4;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBlock}
    <div class="brand">
      <p class="brand-name">On Hand</p>
      <p class="doc-title">Statement of Account</p>
    </div>
  </div>

  <table class="meta">
    <tr><td class="k">Period</td><td class="v">${escapeHtml(statement.label)}</td></tr>
    <tr><td class="k">Generated</td><td class="v">${escapeHtml(generatedLabel)}</td></tr>
    <tr><td class="k">Currency</td><td class="v">${escapeHtml(currencyCode)}</td></tr>
  </table>

  <h2>Summary</h2>
  <table class="balances">
    <tr>
      <td>
        <span class="label">Opening balance</span>
        <span class="value">${escapeHtml(formatMoney(statement.openingLeftover))}</span>
      </td>
      <td>
        <span class="label">Balance at month end</span>
        <span class="value">${escapeHtml(formatMoney(statement.closingLeftover))}</span>
      </td>
    </tr>
  </table>
  <table class="summary">
    ${summaryRows}
  </table>

  <h2>Transactions</h2>
  <table class="ledger">
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Type</th>
        <th class="num">In</th>
        <th class="num">Out</th>
        <th class="num">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${transactionBody}
    </tbody>
  </table>

  <table class="closing">
    <tr>
      <td>Balance at month end</td>
      <td class="num">${escapeHtml(formatMoney(statement.closingLeftover))}</td>
    </tr>
  </table>

  <div class="footer">
    Generated by On Hand · Not a bank statement · For personal records only.
    Figures are what you logged in the app.
  </div>
</body>
</html>`;
}

/** A4 at 72 PPI — matches the template page size. */
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

/**
 * Build the statement PDF and open the system share sheet.
 * Replaces plain-text share for the statement screen.
 */
export async function exportStatementPdf(options: {
    statement: MonthStatement;
    formatMoney: FormatMoneyFn;
    currencyCode: string;
}): Promise<void> {
    const logoDataUri = await loadStatementLogoDataUri();
    const html = buildStatementHtml({
        ...options,
        logoDataUri,
    });

    const { uri } = await Print.printToFileAsync({
        html,
        width: A4_WIDTH,
        height: A4_HEIGHT,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
        throw new Error("Sharing is not available on this device.");
    }

    await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: statementPdfFileName(options.statement),
    });
}
