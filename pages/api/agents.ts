import { CustomPDFLoader } from "@/utils/customPDFLoader";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { NextApiRequest, NextApiResponse } from "next";
const staticAgents = [{
    name: 'NEC Expert',
    avatar: '/img_chemist.png',
    description: 'This is a NEC Expert, here to help you with your NEC questions.',
    docsFolder: 'agents/museee-nec',
    pineconeNameSpace: 'museee-jp',
},
{
    name: 'Covid Doctor',
    avatar: '/img_doctor.png',
    description: 'This is a Covid Expert, here to help you with your Covid questions.',
    docsFolder: 'agents/museee-doctor',
    pineconeNameSpace: 'museee'
}
]

export type Agent = {
    name: string;
    avatarUrl: string;
    description: string;
    metaData: Metadata[];
    namespace: string;
}

class Metadata {
    fileName: string
    pageNumber: number

    constructor(fileName: string, pageNumber: number) {
        this.fileName = fileName;
        this.pageNumber = pageNumber;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const agents: Agent[] = [];
        const metadataPromises: Promise<Metadata[]>[] = [];
        staticAgents.forEach((agent) => {
            metadataPromises.push(loadMetadata(agent.docsFolder));
        });
        const allMetadatas = await Promise.all(metadataPromises);
        allMetadatas.forEach((metadatas, index) => {
            agents.push({
                name: staticAgents[index].name,
                avatarUrl: staticAgents[index].avatar,
                description: staticAgents[index].description,
                metaData: metadatas,
                namespace: staticAgents[index].pineconeNameSpace
            });
        });

        res.status(200).json(agents);
    } catch (error: any) {
        console.log('error', error);
        res.status(500).json({ error: error.message || 'Something went wrong' });
    }
}

async function loadMetadata(filePath: string): Promise<Metadata[]> {
    return new Promise((resolve, reject) => {
        const directoryLoader = new DirectoryLoader(filePath, {
            '.pdf': (path) => new CustomPDFLoader(path),
        });
        directoryLoader.load().then((docs) => {
            const metaData = docs.map((doc) => { return doc.metadata }).map((meta) => { return new Metadata(meta.source.split("/").pop(), meta.pdf_numpages) });
            resolve(metaData);
        }).catch((error) => {
            reject(error);
        }
        );
    });

}