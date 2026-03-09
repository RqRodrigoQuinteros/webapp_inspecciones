const schemas = {
  clinica: [
    { key: 'cumple_normativa', label: '¿Cumple con la normativa sanitaria?', type: 'boolean' },
    { key: 'observaciones', label: 'Observaciones', type: 'text' },
    // Agregar más campos según tipología
  ],
  quirurgicos: [
    // Campos para quirúrgicos
  ],
  // Agregar otras tipologías
};

function getSchema(tipologia) {
  return schemas[tipologia] || [];
}

export { getSchema };