export interface PublishedNote {
  path: string;
  frontmatter: {
    title: string;
    date: string;
    tags: string[];
  };
  content: string;
}

export interface PublishedList {
  notes: PublishedNote[];
}