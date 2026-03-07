interface JsonApiError {
  status: string;
  title: string;
  detail: string;
}

export function formatResource(type: string, id: string | number, attributes: Record<string, unknown>) {
  return {
    data: {
      type,
      id: String(id),
      attributes,
    },
  };
}

export function formatCollection(type: string, items: Array<Record<string, unknown>>) {
  const data = items.map((item) => {
    const { id, ...rest } = item;
    return {
      type,
      id: String(id),
      attributes: rest,
    };
  });
  return { data };
}

export function formatErrors(errors: JsonApiError[]) {
  return { errors };
}
