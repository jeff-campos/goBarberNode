module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('users', {
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
    email: {
      type: Sequelize.STRING, // Tipo string
      allowNull: false,
      unique: true,
    },
    password_hash: {
      /* esse _hash indica que não vamos armazenar a senha
        omo foi criada, ex: 123, vamos criptografar, sendo assim, armazenaremos um hash dela
        */
      type: Sequelize.STRING,
      allowNull: false,
    },
    provider: {
      /* essa aplicação agendamento de serviços de beleza, portanto
      permitirá usuários CLIENTES e usuários PRESTADORES de serviço, quando o usuário por
      prestador de serviço o tipo provider é TRUE, por padrão ele é falso o que
      indica que o usuário é um Cliente.
        */
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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

  down: (queryInterface) => queryInterface.dropTable('users'),
};
