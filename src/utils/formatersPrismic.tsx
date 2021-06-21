import dayjs from 'dayjs';
import ptBr from 'dayjs/locale/pt-br';

dayjs.locale(ptBr);

export function formattedDate(date: string): string {
  return dayjs(date).format('DD MMM YYYY').toLocaleLowerCase();
}

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

export function postFormatter(prismicResponse: PostPagination) {
  const posts = prismicResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    next_page: prismicResponse.next_page,
    results: posts,
  };
}
