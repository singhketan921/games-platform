import Link from "next/link";
import Table from "../../components/Tables/Table";
import ErrorBox from "../../components/ErrorBox";
import { getCallbackHistory } from "../../../src/lib/api";

const columns = [
    { header: "Session", accessor: "id" },
    { header: "Player", accessor: "playerId" },
    { header: "Game", accessor: "gameId" },
    { header: "Ended", accessor: "endedAt", render: (value) => (value ? new Date(value).toLocaleString() : "-") },
    {
        header: "Closed",
        accessor: "isClosed",
        render: (value) => (value ? "Yes" : "No"),
    },
    { header: "Result", accessor: "result" },
];

export default async function CallbacksPage() {
    let callbacks = [];
    let error = "";

    try {
        const payload = await getCallbackHistory();
        callbacks = payload?.callbacks || [];
    } catch (err) {
        error = err.message;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Callback Logs</h1>
                <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
                    Back to overview
                </Link>
            </div>

            {error && <ErrorBox message={error} />}

            <Table columns={columns} data={callbacks} />
        </div>
    );
}
