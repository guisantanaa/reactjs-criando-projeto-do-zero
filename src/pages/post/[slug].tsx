import { Fragment } from 'react';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { GetStaticPaths, GetStaticProps } from 'next';
import PrismicDOM from 'prismic-dom';
import Prismic from '@prismicio/client';
import Link from 'next/link';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

import { formattedDate } from '../../utils/formatersPrismic';
import styles from './post.module.scss';
import commonStyles from '../../styles/common.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string;
      data: { title: string };
    }[];
    nextPost: {
      uid: string;
      data: { title: string };
    }[];
  };
}

export default function Post({
  post,
  preview,
  navigation,
}: PostProps): JSX.Element {
  const router = useRouter();

  const reducer = (sumContent, thisContent): number => {
    const headingWords = thisContent.heading?.split(/\s/g).length || 0;
    const bodyWords = thisContent.body.reduce((sumBody, thisBody) => {
      const textWords = thisBody.text.split(/\s/g).length;

      return sumBody + textWords;
    }, 0);
    return sumContent + headingWords + bodyWords;
  };

  const wordCount = post.data.content.reduce(reducer, 0);

  const isEditedPost =
    post.first_publication_date !== post.last_publication_date;

  let editionDate = '';
  if (isEditedPost) {
    editionDate = `* editado em ${formattedDate(post.last_publication_date)}`;
  }

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />

      <div className={styles.bannerContainer}>
        <img src="/programador.png" alt="programador no celular" />
      </div>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.postInfo}>
            <time>
              <FiCalendar />
              {formattedDate(post.first_publication_date)}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {Math.ceil(wordCount / 200)} min
            </span>
          </div>

          {isEditedPost && (
            <span className={styles.editionDate}>{editionDate}</span>
          )}

          <div className={styles.postContent}>
            {post.data.content.map(({ heading, body }) => (
              <Fragment key={heading}>
                <h2>{heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: PrismicDOM.RichText.asHtml(body),
                  }}
                />
              </Fragment>
            ))}
          </div>
        </article>

        <section className={`${styles.navigation} ${commonStyles.container}`}>
          {navigation?.prevPost.length > 0 && (
            <div>
              <h3>{navigation.prevPost[0].data.title}</h3>
              <Link href={`/post/${navigation.prevPost[0].uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}

          {navigation?.nextPost.length > 0 && (
            <div>
              <h3>{navigation.prevPost[0].data.title}</h3>
              <Link href={`/post/${navigation.nextPost[0].uid}`}></Link>
              <a>Próximo post</a>
            </div>
          )}
        </section>

        <Comments />

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date]',
    }
  );

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
    },
    revalidate: 60 * 60 * 12, // 12 horas
  };
};
