import { store } from '../store.js';
import { broadcast } from '../sse.js';
import type { FeedItem } from '@lobster/shared';
import { nanoid } from '../utils.js';

export function addFeedItem(partial: Omit<FeedItem, 'id' | 'timestamp'>) {
  const item: FeedItem = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    ...partial,
  };
  store.addFeedItem(item);
  broadcast({ event: 'feed', data: item });
  return item;
}
