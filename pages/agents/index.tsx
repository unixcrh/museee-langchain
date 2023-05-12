import Layout from '@/components/layout';
import React, { useEffect, useState } from 'react';
import { Knowledge } from '../knowledge';
import ReactModal from 'react-modal';
import { Icon } from '@iconify/react';
import fetchAgents from '../api/agents';

const userId = '1';

export type Agent = {
  id: number;
  name: string;
  description: string;
  temperature: number;
  owner: number;
  knowledgeId: number;
  knowledge: Knowledge | undefined;
};

export default function Agents(props: any) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [agentCreationModalOpen, setAgentCreationModalOpen] =
    useState<boolean>(false);
  const fetchAllAgents = async () => {
    setLoading(true);
    try {
      const agents = await fetchAgents(userId);
      console.log('agents', agents);
      setAgents(agents);
      setLoading(false);
    } catch (error) {
      console.log('error', error);
      setLoading(false);
      alert(`Error fetching agents ${error}`);
    }
  };

  useEffect(() => {
    fetchAllAgents();
  }, []);

  console.log('props', props);
  return (
    <>
      <Layout tabIndex={1}>
        <main className="flex w-full min-h-screen flex-1 flex-col overflow-hidden p-10 bg-gray-200">
          <h1 className="flex items-center">
            <p className="font-bold text-black text-2xl">My Agents</p>
            <button
              onClick={() => setAgentCreationModalOpen(true)}
              className="ml-4 bg-blue-600 px-4 py-2 rounded-full text-white font-bold text-sm"
            >
              Create Agent
            </button>
          </h1>
          <div className="flex gap-4 mt-8">
            {loading ? (
              <div className="text-gray-400  text-lg">Loading agents...</div>
            ) : null}
            {agents?.map((agent) => (
              <div className="bg-white rounded-2xl p-6 w-80" key={agent.name}>
                <div className="flex items-center">
                  <h2 className="text-black font-bold text-lg">{agent.name}</h2>
                  <div className="text-xs ml-2 px-2 py-1  rounded-full bg-blue-400 text-white">
                    {getStrictnessName(agent.temperature)}
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  {agent.description}
                </p>
                <div className="mt-6 mb-1 text-sm text-gray-400">Knowledge</div>
                {agent.knowledge?.files?.map((file) => (
                  <div className="text-sm text-blue-600">
                    {file.originalFilename}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <AgentCreationModal
            isOpen={agentCreationModalOpen}
            onAgentCreateSuccess={() => {
              setAgentCreationModalOpen(false);
              fetchAllAgents();
            }}
            onAgentCreateFailure={() => setAgentCreationModalOpen(false)}
            onModalClose={() => setAgentCreationModalOpen(false)}
          ></AgentCreationModal>
        </main>
      </Layout>
    </>
  );
}

export enum Strictness {
  Creative = 0.6,
  Balanced = 0.2,
  Factual = 0,
}

function getStrictnessName(value: number): string | undefined {
  return Object.keys(Strictness).find(
    (key) => Strictness[key as keyof typeof Strictness] === value,
  );
}

export function AgentCreationModal(props: any) {
  const [allKnowledge, setAllKnowledge] = useState<Knowledge[]>([]);
  const [linkedKnowledge, setLinkedKnowledge] = useState<Knowledge>();
  const [agentName, setAgentName] = useState<string>('');
  const [agentDescription, setAgentDescription] = useState<string>('');
  const [selectedStrictness, setSelectedStrictness] = useState<Strictness>(
    Strictness.Balanced,
  );

  useEffect(() => {
    fetchAllKnowledge();
  }, []);

  const fetchAllKnowledge = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/knowledge?owner=${userId}`,
        {
          method: 'GET',
        },
      );
      const data = await response.json();
      setAllKnowledge(data);
      console.log('fetchKnowledge', data);
    } catch (error) {
      console.log('error', error);
      alert('Error fetching knowledge ${error}');
    }
  };

  const handleAgentCreation = async () => {
    if (!agentName) {
      alert('Please enter a name for your agent');
      return;
    }

    if (!agentDescription) {
      alert('Please enter a description for your agent');
      return;
    }

    if (!linkedKnowledge) {
      alert('Please select knowledge for your agent');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/agents`, {
        method: 'POST',
        body: JSON.stringify({
          name: agentName,
          description: agentDescription,
          knowledgeId: linkedKnowledge.id,
          owner: userId,
          temperature: selectedStrictness,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      props.onAgentCreateSuccess();
    } catch (error) {
      console.log('error', error);
      alert('Error creating agent ${error}');
      props.onAgentCreateFailure();
    }
  };

  return (
    <>
      <ReactModal
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            borderRadius: '12px',
            padding: '40px',
          },
          overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
        }}
        isOpen={props.isOpen}
      >
        <div className="font-bold text-black text-2xl flex justify-between">
          Create Your Agent
          <Icon
            className="cursor-pointer"
            onClick={props.onModalClose}
            icon="material-symbols:close"
          />
        </div>

        <div className="mt-6">Agent Name</div>
        <input
          onChange={(e) => setAgentName(e.target.value)}
          value={agentName}
          className="border border-gray-300 rounded-md p-2 w-96 mt-2"
        />

        <div className="mt-4">Agent Description</div>
        <textarea
          onChange={(e) => setAgentDescription(e.target.value)}
          rows={3}
          className="border border-gray-300 rounded-md p-2 w-96 mt-2"
        />

        <div className="mt-4">Linking Your Knowledge</div>
        <div className="flex gap-4">
          {allKnowledge?.map((knowledge) => (
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                disabled={
                  linkedKnowledge && knowledge.id !== linkedKnowledge?.id
                }
                className="mr-2 w-4 h-4"
                onChange={(e) => {
                  const linkedKnowledge = e.target.checked
                    ? allKnowledge.find((k) => k.id === knowledge.id)
                    : undefined;
                  setLinkedKnowledge(linkedKnowledge);
                }}
              />
              <div className="text-gray-600">
                {knowledge.folderName}({knowledge.files?.length || 0})
              </div>
            </div>
          ))}
        </div>

        {/* Strictness */}
        <div className="mt-10">Knowledge Base Strictness</div>
        <div className="text-gray-500 text-sm">
          How much should the AI stick to the source knowledge.
        </div>
        <div className="flex gap-4 mt-2">
          <div
            onClick={() => setSelectedStrictness(Strictness.Creative)}
            className={`cursor-pointer flex flex-1 px-4 items-center py-2 rounded-xl ${
              selectedStrictness === Strictness.Creative
                ? 'bg-blue-400 text-white'
                : 'text-black'
            }`}
          >
            <Icon icon="mdi:lightbulb-on-outline" className="text-lg mr-2" />
            Creative
          </div>

          <div
            onClick={() => setSelectedStrictness(Strictness.Balanced)}
            className={`cursor-pointer flex flex-1  items-center px-4 py-2 rounded-xl ${
              selectedStrictness === Strictness.Balanced
                ? 'bg-blue-400 text-white'
                : 'text-black'
            }`}
          >
            <Icon icon="mingcute:balance-fill" className="text-lg mr-2" />
            Balanced
          </div>

          <div
            onClick={() => setSelectedStrictness(Strictness.Factual)}
            className={`cursor-pointer flex flex-1  items-center px-4 py-2 rounded-xl ${
              selectedStrictness === Strictness.Factual
                ? 'bg-blue-400 text-white'
                : 'text-black'
            }`}
          >
            <Icon
              icon="material-symbols:fact-check-rounded"
              className="text-lg mr-2"
            />
            Factual
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleAgentCreation}
            className="bg-blue-600 px-4 py-2 rounded-full text-white font-bold text-sm mt-8"
          >
            Create Agent
          </button>
        </div>
      </ReactModal>
    </>
  );
}
