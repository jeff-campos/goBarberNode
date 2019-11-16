module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('files', {
    id: {
      type: Sequelize.INTEGER, // Tipo da variavél é INTEGER
      allowNull: false, // Não permite valor nulo
      autoIncrement: true, // Auto Incremental
      primaryKey: true, // Chave Primaria da tabela
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    path: {
      type: Sequelize.STRING, // Tipo string
      allowNull: false,
      unique: true,
    },
    created_at: { // data de criação do registro
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: { // data de atualização dop registro
      type: Sequelize.DATE,
      allowNull: false,
    },
  }),

  down: (queryInterface) => queryInterface.dropTable('files'),
};
