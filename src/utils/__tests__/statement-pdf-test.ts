import { buildMonthStatement } from "@/utils/month-statement";
import {
    buildStatementHtml,
    statementPdfFileName,
} from "@/utils/statement-pdf";
import {
    makeExpense,
    makeIncome,
} from "./factories";

const februaryAnchor = new Date(2026, 1, 15);

function money(amount: number, options?: { sign?: "+" | "−" | "" }) {
    const sign = options?.sign ?? "";
    return `${sign}$${amount}`;
}

describe("buildStatementHtml", () => {
    it("renders a professional statement of account layout", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [
                makeIncome({
                    date: "2026-02-01",
                    net: 1000,
                    source: "Salary",
                }),
            ],
            expenses: [
                makeExpense({
                    date: "2026-02-01",
                    amount: 50,
                    name: "Lunch",
                }),
            ],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        const html = buildStatementHtml({
            statement,
            formatMoney: money,
            currencyCode: "USD",
            logoDataUri: "data:image/png;base64,ABC",
            generatedAt: new Date(2026, 8, 21),
        });

        expect(html).toContain("Statement of Account");
        expect(html).toContain("On Hand");
        expect(html).toContain("Feb 2026");
        expect(html).toContain("USD");
        expect(html).toContain("Opening balance");
        expect(html).toContain("Balance at month end");
        expect(html).toContain("Salary");
        expect(html).toContain("Lunch");
        expect(html).toContain("Money in (income)");
        expect(html).toContain("data:image/png;base64,ABC");
        expect(html).toContain("Not a bank statement");
        expect(html).toContain("<th class=\"num\">In</th>");
        expect(html).toContain("<th class=\"num\">Out</th>");
        expect(html).toContain("<th class=\"num\">Balance</th>");
        expect(html).toContain('class="num bal"');
        expect(statementPdfFileName(statement)).toBe(
            "on-hand-statement-2026-02.pdf"
        );
    });

    it("escapes untrusted labels in the HTML", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [],
            expenses: [
                makeExpense({
                    date: "2026-02-02",
                    amount: 10,
                    name: `<script>alert("x")</script>`,
                }),
            ],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        const html = buildStatementHtml({
            statement,
            formatMoney: money,
            currencyCode: "PHP",
        });

        expect(html).toContain("&lt;script&gt;");
        expect(html).not.toContain("<script>alert");
    });

    it("shows an empty-month message when there are no transactions", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [],
            expenses: [],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        const html = buildStatementHtml({
            statement,
            formatMoney: money,
            currencyCode: "USD",
        });

        expect(html).toContain("No money moved this month.");
    });
});
