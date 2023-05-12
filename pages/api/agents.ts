import getConfig from 'next/config';
import { Agent } from '../agents';
import { Knowledge } from '../knowledge';

export default async function fetchAgents(userId: string): Promise<Agent[]> {
  const { publicRuntimeConfig } = getConfig();

  const fetchAgentsPromise = new Promise((resolve, reject) => {
    try {
      fetch(
        `http://${publicRuntimeConfig.DB_HOST}:3001/agents?owner=${userId}`,
        {
          method: 'GET',
        },
      )
        .then((response) => {
          if (response.status !== 200) {
            reject(`Error fetching agents ${response.status}`);
          }
          return response.json();
        })
        .then((agents) => {
          resolve(agents);
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      console.log('error', error);
    }
  });

  const fetchKnowledgePromise = new Promise((resolve, reject) => {
    try {
      fetch(
        `http://${publicRuntimeConfig.DB_HOST}:3001/knowledge?owner=${userId}`,
        {
          method: 'GET',
        },
      )
        .then((response) => {
          if (response.status !== 200) {
            reject(`Error fetching knowledge ${response.status}`);
          }
          return response.json();
        })
        .then((knowledge) => {
          resolve(knowledge);
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      console.log('error', error);
    }
  });

  return Promise.all([fetchAgentsPromise, fetchKnowledgePromise]).then(
    (values) => {
      const agents: Agent[] = [];
      const allAgents: Agent[] = values[0] as Agent[];
      const allKnowledge: Knowledge[] = values[1] as Knowledge[];
      allAgents.forEach((agent: Agent) => {
        let knowledge = allKnowledge.find(
          (knowledge) => knowledge.id === agent.knowledgeId,
        );
        if (Array.isArray(knowledge) && knowledge.length > 0) {
          knowledge = knowledge[0];
        }
        agents.push({
          id: agent.id,
          name: agent.name,
          temperature: agent.temperature,
          description: agent.description,
          knowledgeId: agent.knowledgeId,
          owner: agent.owner,
          knowledge: knowledge,
        });
      });

      return agents;
    },
  );
}
