import { useEffect } from 'react';

export default function Comments(): JSX.Element {
  useEffect(() => {
    const anchor = document.getElementById('post-comments');
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('repo', 'jardelbordignon/spacetraveling');
    script.setAttribute('issue-term', 'url');
    script.setAttribute('label', 'comment :speech_balloon:');
    script.setAttribute('theme', 'photon-dark');

    anchor.appendChild(script);
  }, []);
  return <div style={{ width: '100%' }} id="post-comments" />;
}
