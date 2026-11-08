export function failD1BatchAtStatement(db: D1Database, failingIndex: number): D1Database {
  return new Proxy(db, {
    get(target, property) {
      if (property === 'batch') {
        return (statements: D1PreparedStatement[]) => target.batch(statements.map((statement, index) =>
          index === failingIndex
            ? target.prepare('INSERT INTO d1_fault_injection_missing_table (id) VALUES (?)').bind('fault')
            : statement
        ));
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
