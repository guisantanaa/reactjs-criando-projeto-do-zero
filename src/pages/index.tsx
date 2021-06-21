import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';
import { formattedDate, postFormatter } from '../utils/formatersPrismic';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  // const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadPosts(): Promise<void> {
    await fetch(nextPage || '')
      .then(response => response.json())
      .then(data => {
        const formattedData = postFormatter(data);
        setPosts([...posts, ...formattedData.results]);
        setNextPage(formattedData.next_page);
      });
  }

  return (
    <>
      <header className={styles.header}>
        <img src="/vector.png" alt="vector logo" />
        <img src="/logo.png" alt="logo" />
      </header>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <span>{post.data.subtitle}</span>
                <div>
                  <FiCalendar />
                  <time>{formattedDate(post.first_publication_date)}</time>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {nextPage && (
          <button type="button" onClick={handleLoadPosts}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      // fetch: ['post.title', 'post.author', 'post.content'],
      pageSize: 1,
    }
  );

  const postsPagination = postFormatter(postsResponse);

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60 * 12, // 12 horas
  };
};
