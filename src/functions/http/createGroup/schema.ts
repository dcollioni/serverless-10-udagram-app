export default {
    title: "Group",
    type: "object",
    properties: {
      name: { type: 'string' },
      description: { type: 'string' }
    },
    required: ['name', 'description'],
    additionalProperties: false
  } as const;
  