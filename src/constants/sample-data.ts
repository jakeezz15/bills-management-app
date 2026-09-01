import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { Income } from "@/types/income";

export const billsData: Bill[] = [
    {
        id: "1",
        name: "Electricity",
        amount: 120,
        dueDay: 15,
        isPaid: false,
        category: "Utilities",
    },
    {
        id: "2",
        name: "Water",
        amount: 80,
        dueDay: 10,
        isPaid: false,
        category: "Utilities",
    },
    {
        id: "3",
        name: "Rent",
        amount: 500,
        dueDay: 30,
        isPaid: false,
        category: "House",
    },
]

export const incomeData: Income[] = [
    {
        id: "1",
        date: "07/28/26",
        gross: 1100,
        net: 900,
        source: "Salary"
    },
    {
        id: "2",
        date: "08/28/26",
        gross: 1200,
        net: 1000,
        source: "Salary"
    }
]

export const debtData: Debt[] = [
    {
        id: "1",
        name: "Iphone 16 Pro Max",
        balance: 500,
        dueDay: 15,
        minimumPayment: 45,
        isPaid: false,
        remarks: "Can't pay right now"
    },
    {
        id: "2",
        name: "Macbook Air",
        balance: 800,
        dueDay: 15,
        minimumPayment: 75,
        isPaid: false,
    }
]
