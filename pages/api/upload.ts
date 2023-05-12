import { ingestFiles } from '@/scripts/ingest-data';
import { generateNameSpace } from '@/utils/data';
import formidable, { File } from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';

interface FormFields {
  [key: string]: string | string[];
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const form = formidable({ multiples: true });

  form.parse(req, (err: Error, fields: FormFields, files: formidable.Files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error uploading files.' });
      return;
    }

    let uploadedFilePaths: string[] = [];
    let uploadedFiles: File[] = [];
    if (Array.isArray(files.files)) {
      uploadedFilePaths = files.files.map((file: File) => file.filepath);
      uploadedFiles = files.files;
    } else {
      uploadedFilePaths = [files.files.filepath];
      uploadedFiles = [files.files];
    }

    const knowledgeId = fields.id as string;
    const userId = fields.userId as string;
    const folderName = fields.folderName as string;
    updateKnowledgeFiles(knowledgeId, uploadedFiles);
    ingestFiles(uploadedFilePaths, generateNameSpace(folderName, userId));

    res.status(200).json({ message: 'Files uploaded successfully.' });
  });
}

const updateKnowledgeFiles = async (knowledgeId: string, files: File[]) => {
  const body = {
    files,
  };
  try {
    const response = await fetch(
      `${process.env.DB_BASE_URL}/knowledge/${knowledgeId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const data = await response.json();
    console.log('uploadUserKnowledge', data);
  } catch (error) {
    console.log('error', error);
  }
};
