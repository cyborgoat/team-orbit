import type { Client } from 'openapi-fetch';
import { unwrap } from './errors.js';
import type { BodyOf, LoginMethod, QueryOf, ResponseOf } from './types.js';
import type { paths } from './schema.js';

type Raw = Client<paths>;
// The generic helpers below call the raw client with computed paths, which the
// compiler cannot narrow; the public signatures are what keep callers type-safe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

const call = async (client: Raw, method: string, path: string, init?: object) =>
  unwrap(await (client as Loose)[method](path, init ?? {}));

type Page<T> = { items: T[]; total: number; page: number; limit: number };

/** Builds list/get/create/update/delete for a standard `/<collection>` + `/<collection>/{id}` resource. */
function crud<
  C extends '/users' | '/announcements' | '/events' | '/news' | '/blog-posts',
  I extends '/users/{id}' | '/announcements/{id}' | '/events/{id}' | '/news/{id}' | '/blog-posts/{id}',
>(client: Raw, collection: C, item: I) {
  const withId = (id: string) => ({ params: { path: { id } } });

  async function list(query?: QueryOf<C>) {
    return call(client, 'GET', collection, { params: { query } }) as Promise<ResponseOf<C, 'get'>>;
  }

  return {
    list,
    get: (id: string) => call(client, 'GET', item, withId(id)) as Promise<ResponseOf<I, 'get'>>,
    create: (body: BodyOf<C, 'post'>) =>
      call(client, 'POST', collection, { body }) as Promise<ResponseOf<C, 'post'>>,
    update: (id: string, body: BodyOf<I, 'patch'>) =>
      call(client, 'PATCH', item, { ...withId(id), body }) as Promise<ResponseOf<I, 'patch'>>,
    delete: (id: string) => call(client, 'DELETE', item, withId(id)) as Promise<ResponseOf<I, 'delete'>>,
    /** Async iterator over every item, fetching pages on demand. */
    async *iterate(query?: Omit<NonNullable<QueryOf<C>>, 'page'>) {
      for (let page = 1; ; page++) {
        const res = (await list({ ...query, page } as unknown as QueryOf<C>)) as unknown as Page<unknown>;
        yield* res.items as Array<ResponseOf<C, 'get'> extends { items: (infer T)[] } ? T : never>;
        if (res.page * res.limit >= res.total || res.items.length === 0) return;
      }
    },
  };
}

export function createResources(client: Raw, auth: { setToken(t: string | undefined): void }) {
  const withId = (id: string) => ({ params: { path: { id } } });

  return {
    auth: {
      /** Registers a PENDING member. Email may be omitted or null. */
      register: (body: BodyOf<'/auth/register', 'post'>) =>
        call(client, 'POST', '/auth/register', { body }) as Promise<ResponseOf<'/auth/register', 'post'>>,
      /**
       * Logs in and remembers the returned token for later requests.
       * Infers email when identifier contains @; otherwise uses username.
       * Pass method explicitly for usernames containing @.
       */
      async login(
        identifier: string,
        password: string,
        method: LoginMethod = identifier.includes('@') ? 'email' : 'username',
      ) {
        const res = (await call(client, 'POST', '/auth/login', {
          body: { [method]: identifier, password },
        })) as ResponseOf<'/auth/login', 'post'>;
        auth.setToken(res.accessToken);
        return res;
      },
      logout: () => auth.setToken(undefined),
      me: () => call(client, 'GET', '/auth/me') as Promise<ResponseOf<'/auth/me', 'get'>>,
      updateMe: (body: BodyOf<'/auth/me', 'patch'>) =>
        call(client, 'PATCH', '/auth/me', { body }) as Promise<ResponseOf<'/auth/me', 'patch'>>,
      changePassword: (body: BodyOf<'/auth/change-password', 'post'>) =>
        call(client, 'POST', '/auth/change-password', { body }) as Promise<
          ResponseOf<'/auth/change-password', 'post'>
        >,
    },
    users: crud(client, '/users', '/users/{id}'),
    events: crud(client, '/events', '/events/{id}'),
    announcements: crud(client, '/announcements', '/announcements/{id}'),
    news: crud(client, '/news', '/news/{id}'),
    blogPosts: crud(client, '/blog-posts', '/blog-posts/{id}'),
    notifications: {
      list: (query?: QueryOf<'/notifications'>) =>
        call(client, 'GET', '/notifications', { params: { query } }) as Promise<
          ResponseOf<'/notifications', 'get'>
        >,
      markRead: (id: string) =>
        call(client, 'POST', '/notifications/{id}/read', withId(id)) as Promise<
          ResponseOf<'/notifications/{id}/read', 'post'>
        >,
    },
    forum: {
      listPosts: (query?: QueryOf<'/forum-posts'>) =>
        call(client, 'GET', '/forum-posts', { params: { query } }) as Promise<ResponseOf<'/forum-posts', 'get'>>,
      getPost: (id: string) =>
        call(client, 'GET', '/forum-posts/{id}', withId(id)) as Promise<ResponseOf<'/forum-posts/{id}', 'get'>>,
      createPost: (body: BodyOf<'/forum-posts', 'post'>) =>
        call(client, 'POST', '/forum-posts', { body }) as Promise<ResponseOf<'/forum-posts', 'post'>>,
      updatePost: (id: string, body: BodyOf<'/forum-posts/{id}', 'patch'>) =>
        call(client, 'PATCH', '/forum-posts/{id}', { ...withId(id), body }) as Promise<
          ResponseOf<'/forum-posts/{id}', 'patch'>
        >,
      deletePost: (id: string) =>
        call(client, 'DELETE', '/forum-posts/{id}', withId(id)) as Promise<
          ResponseOf<'/forum-posts/{id}', 'delete'>
        >,
      addComment: (postId: string, body: BodyOf<'/forum-posts/{id}/comments', 'post'>) =>
        call(client, 'POST', '/forum-posts/{id}/comments', { ...withId(postId), body }) as Promise<
          ResponseOf<'/forum-posts/{id}/comments', 'post'>
        >,
      updateComment: (id: string, body: BodyOf<'/forum-comments/{id}', 'patch'>) =>
        call(client, 'PATCH', '/forum-comments/{id}', { ...withId(id), body }) as Promise<
          ResponseOf<'/forum-comments/{id}', 'patch'>
        >,
      deleteComment: (id: string) =>
        call(client, 'DELETE', '/forum-comments/{id}', withId(id)) as Promise<
          ResponseOf<'/forum-comments/{id}', 'delete'>
        >,
      /** `1` = up, `-1` = down, `0` = clear. */
      votePost: (id: string, value: BodyOf<'/forum-posts/{id}/vote', 'put'>['value']) =>
        call(client, 'PUT', '/forum-posts/{id}/vote', { ...withId(id), body: { value } }) as Promise<
          ResponseOf<'/forum-posts/{id}/vote', 'put'>
        >,
      voteComment: (id: string, value: BodyOf<'/forum-comments/{id}/vote', 'put'>['value']) =>
        call(client, 'PUT', '/forum-comments/{id}/vote', { ...withId(id), body: { value } }) as Promise<
          ResponseOf<'/forum-comments/{id}/vote', 'put'>
        >,
    },
    uploads: {
      /** Uploads an image (max 5 MB). Returns `{ url }`, relative to `baseUrl`. */
      upload(file: Blob, filename?: string) {
        const form = new FormData();
        if (filename) form.append('file', file, filename);
        else form.append('file', file);
        return call(client, 'POST', '/uploads', { body: {}, bodySerializer: () => form }) as Promise<
          ResponseOf<'/uploads', 'post'>
        >;
      },
    },
    health: () => call(client, 'GET', '/health') as Promise<ResponseOf<'/health', 'get'>>,
  };
}
