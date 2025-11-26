import Link from "next/link";
import Table from "../../components/Tables/Table";
import ErrorBox from "../../components/ErrorBox";
import { getSessions } from "../../../src/lib/api";

const columns = [
    { header: "ID", accessor: "id" },
    { header: "Player", accessor: "playerId" },
    { header: "Game", accessor: "gameId" },
    { header: "Started", accessor: "startedAt", render: (value) => (value ? new Date(value).toLocaleString() : "-") },
    { header: "Ended", accessor: "endedAt", render: (value) => (value ? new Date(value).toLocaleString() : "-") },
    { header: "Result", accessor: "result" },
    { header: "Bet Amount", accessor: "betAmount" },
];

export default async function SessionsPage() {
    let sessions = [];
    let error = "";

    try {
        const payload = await getSessions();
        sessions = payload?.sessions || [];
    } catch (err) {
        error = err.message;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">All Sessions</h1>
                <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
                    Back to overview
                </Link>
            </div>

            {error && <ErrorBox message={error} />}

            <Table columns={columns} data={sessions} />
        </div>
    );
}
