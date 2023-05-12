import Layout from '@/components/layout';
import { generateNameSpace } from '@/utils/data';
import { Icon } from '@iconify/react';
import { File } from 'formidable';
import { use, useEffect, useState } from 'react';

const userId = '1';
export interface Knowledge {
  id: number;
  owner: number;
  folderName: string;
  namespace: string;
  files: File[];
}

export default function Knowledge(props: any) {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge>();

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/knowledge?owner=${userId}`,
        {
          method: 'GET',
        },
      );
      const data = await response.json();
      setKnowledge(data);
      setSelectedKnowledge(data[0]);
      console.log('fetchKnowledge', data);
    } catch (error) {
      console.log('error', error);
      alert('Error fetching knowledge ${error}');
    }
  };

  const createKnowledgeFolder = async () => {
    const folderName = prompt('Enter folder name');
    if (!folderName) {
      return;
    }
    try {
      const namespace = generateNameSpace(folderName, userId);
      const response = await fetch(`http://localhost:3001/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: userId,
          folderName: folderName,
          namespace,
        }),
      });
      const data = await response.json();
      console.log('createDraftFolder', data);
      fetchKnowledge();
    } catch (error) {
      console.log('error', error);
      alert('Error creating draft folder ${error}');
    }
  };

  return (
    <>
      <Layout tabIndex={2}>
        <div className="flex w-full min-h-screen flex-1 overflow-hidden bg-gray-200">
          <div className="py-10 bg-white w-fit h-full border-r">
            <button
              onClick={createKnowledgeFolder}
              className="rounded-full m-8 bg-blue-400 px-4 py-2 text-white text-sm"
            >
              Create Knowledge Folder
            </button>
            {knowledge.map((knowledge) => (
              <div
                onClick={() => setSelectedKnowledge(knowledge)}
                className={`flex cursor-pointer px-8 py-4 ${
                  selectedKnowledge?.id === knowledge.id ? 'bg-blue-100' : ''
                }`}
                key={knowledge.id}
              >
                <Icon
                  className="text-3xl text-blue-300"
                  icon="material-symbols:folder-rounded"
                />
                <div className="flex items-center">
                  <h2 className="text-black  ml-2">{knowledge.folderName}</h2>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-center flex-1 bg-white">
            <form
              encType="multipart/form-data"
              method="POST"
              action="/api/upload"
              className="p-4 border-2 border-blue-200 rounded-lg"
            >
              <input type="file" name="files" multiple accept=".pdf" />
              <input type="hidden" name="id" value={selectedKnowledge?.id} />
              <input type="hidden" name="userId" value={userId} />
              <input
                type="hidden"
                name="folderName"
                value={selectedKnowledge?.folderName}
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-300 px-4 py-1 text-white font-bold"
              >
                Upload
              </button>
            </form>

            <div className="mt-10">
              <div className="font-bold text-black">Stored Documents</div>
              <div className="text-sm text-gray-500">
                These are all uploaded documents that Museee can learn from.
              </div>

              <div className="mt-6 text-gray-600 flex justify-between">
                <div>NAME</div>
                <div>STATUS</div>
              </div>
              <div className="mt-2">
                {selectedKnowledge?.files?.map((file) => (
                  <div className="py-2 border-t flex justify-between gap-10">
                    <div>{file.originalFilename}</div>
                    <div className="text-green-500 font-bold">LEARNED</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
