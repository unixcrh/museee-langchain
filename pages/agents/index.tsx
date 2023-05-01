import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import { Agent } from "../api/agents";
import Image from "next/image";


export default function Agents(props: any) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const fetchAgents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/agents', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            setAgents(data);
            setLoading(false);
        } catch (error) {
            console.log('error', error);
            setLoading(false);
            alert('Error fetching agents ${error}');
        }
    }

    useEffect(() => {
        fetchAgents();
    }, []);

    console.log('props', props);
    return (
        <>
            <Layout tabIndex={1}>
                <main className="flex w-full min-h-screen flex-1 flex-col overflow-hidden p-10 bg-gray-200">
                    <h1 className="flex items-center">
                        <p className="font-bold text-black text-2xl">My Agents</p>
                        <button className="ml-4 bg-blue-600 px-4 py-2 rounded-full text-white font-bold text-sm">Create agent</button>
                    </h1>
                    <div className="flex gap-4 mt-8">
                        {loading ? <div className="text-gray-400  text-lg">Loading agents...</div> : null}
                        {agents.map((agent) => (
                            <div className="bg-white rounded-2xl p-6 w-80" key={agent.name}>
                                <div className="flex items-center">
                                    <Image className="rounded-full" alt={agent.name} src={agent.avatarUrl} width={28} height={28} />
                                    <h2 className="text-black font-bold text-lg ml-2">{agent.name}</h2>
                                </div>
                                <p className="text-gray-500 text-sm mt-2">{agent.description}</p>
                                <div className="mt-6 mb-1 text-sm text-gray-400">Knowledges</div>
                                {agent.metaData.map((metaData) => (
                                    <div className="text-sm text-blue-600">{metaData.fileName} <span className="text">{metaData.pageNumber}</span></div>
                                ))}
                            </div>
                        ))}
                    </div>
                </main>
            </Layout>
        </>)
}
