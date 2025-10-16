"use client";

import React, { useEffect } from 'react';
import Markdown from 'react-markdown';

const MarkdownViewer = ({ content }: { content: string }) => {
  const [localContent, setLocalContent] = React.useState(content);
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  console.log(content);


  return (
    <div className='w-full"'>
      <Markdown>{localContent}</Markdown>
    </div>
  );
};

export default MarkdownViewer;
