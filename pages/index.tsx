import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Agent } from './api/agents';
import { Icon } from '@iconify/react';

const QA_PROMPT = `You are a helpful AI assistant. Use the following pieces of context to answer the question at the end, please answer as long as possible.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}, Helpful answer in markdown`;

export default function Home() {
  const LANGUAGES = [
    { name: 'English', prompt: 'English' },
    { name: '中文', prompt: 'Chinese' },
    { name: '日本語', prompt: 'Japanese' },
    { name: '한국어', prompt: 'Korean' },
  ];

  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<Agent>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [language, setLanguage] = useState<string>('English');
  const [languages, setLanguages] = useState<{ name: string; prompt: string }[]>(LANGUAGES);
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
      setAgent(data[0]);
      setLoading(false);
      setMessageState({
        messages: [
          {
            message: `Hi, I'm ${data[0].name}, do you have any questions?`,
            type: 'apiMessage',
          },
        ],
        history: [],
      })
    } catch (error) {
      console.log('error', error);
      setLoading(false);
      alert('Error fetching agents ${error}');
    }
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [],
    history: [],
  });

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const namespace = agent?.namespace;
      const prompt = QA_PROMPT + `, Please answer in ${language}:`;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
          prompt,
          namespace
        }),
      });
      const data = await response.json();
      console.log('data', data);

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.text]],
        }));
      }
      console.log('messageState', messageState);

      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const handleAgentSelect = (agentName: string) => {
    const agent = agents.find((agent) => agent.name === agentName);
    console.log('set agent', agent);
    setAgent(agent);
    setMessageState({
      messages: [
        {
          message: `Hi, I'm ${agent?.name} do you have any question?`,
          type: 'apiMessage',
        },
      ],
      history: [],
    })
  }

  const handleLanguageSelect = (language: string) => {
    setLanguage(language);
  }

  return (
    <>
      <Layout tabIndex={0}>
        <div className="flex flex-col w-full h-full items-center">
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center mt-8">
            MUSEEE Chat
          </h1>

          <main className='flex flex-col items-center h-full main-width mt-8 relative'>
            {/* Content */}
            <div className='message-list-height w-full'>
              <div ref={messageListRef} className={styles.messagelist}>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src={`${agent ? agent.avatarUrl : "/bot-image.png"}`}
                        alt="AI"
                        width="40"
                        height="40"
                        className='rounded-full shrink-0 grow-0'
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/usericon.png"
                        alt="Me"
                        width="40"
                        height="40"
                        className='rounded-full shrink-0 grow-0'
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <>
                      <div key={`chatMessage-${index}`} className={`${loading && index === messages.length - 1 ? 'usermessagewaiting' : ''} flex gap-4 p-6`}>
                        <div className='shrink-0'>{icon}</div>
                        <div className={styles.markdownanswer}>
                          <ReactMarkdown linkTarget="_blank">
                            {message.message}
                          </ReactMarkdown>

                          {message.sourceDocs && (
                            <div
                              className=""
                              key={`sourceDocsAccordion-${index}`}
                            >
                              <Accordion
                                type="single"
                                collapsible
                                className="flex-col"
                              >
                                {message.sourceDocs.map((doc, index) => (
                                  <div key={`messageSourceDocs-${index}`}>
                                    <AccordionItem value={`item-${index}`}>
                                      <AccordionTrigger>
                                        <h3 className='text-blue-600 text-sm'>Source {index + 1}</h3>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <ReactMarkdown linkTarget="_blank">
                                          {doc.pageContent}
                                        </ReactMarkdown>
                                        <p className="mt-2">
                                          <b>Source:</b> {doc.metadata.source?.split('/').pop()}
                                        </p>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </div>
                                ))}
                              </Accordion>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })}
              </div>
            </div>
            {/* Input */}
            <div className='w-full absolute bottom-1 bg-white'>
              <div className='flex items-center '>
                <div className='text-gray-400 flex items-center'>
                  <Icon icon="fluent:bot-24-filled" className='text-lg' />
                  <div className='ml-1'>Chat with</div>
                  {
                    agent && <Image className="rounded-full ml-2" alt={agent.name} src={agent.avatarUrl} width={20} height={20} />
                  }

                  <select className='ml-2 text-black font-bold' onChange={(e) => handleAgentSelect(e.target.value)}>
                    {agents.map((agent) => (
                      <option key={agent.name} value={agent.name}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='ml-10 text-gray-400 flex items-center'>
                  <Icon name='language' className='mr-2' icon='material-symbols:language' />
                  <div>Output in</div>
                  <select className=' text-black font-bold' onChange={(e) => handleLanguageSelect(e.target.value)}>
                    {languages.map((language) => (
                      <option key={language.prompt} value={language.prompt}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={`border-2 rounded-2xl p-4 mt-2 ${loading && 'bg-gray-200'}`}>
                <form onSubmit={handleSubmit} className='flex'>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={1}
                    maxLength={512}
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Waiting for response...'
                        : 'Input your question'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className='w-full outline-none text-lg'
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className=''
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
        </div >
        <footer className="m-auto p-2">
          Powered by MUSEEE
        </footer>
      </Layout >
    </>
  );
}
