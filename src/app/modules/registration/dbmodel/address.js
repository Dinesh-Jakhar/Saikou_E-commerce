module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    'Address',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
        // onDelete: 'CASCADE',
      },
      addressLine1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      addressLine2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      districtOrCounty: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stateOrRegion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postalCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      countryCode: {
        type: DataTypes.STRING(2), // ISO 3166-1 alpha-2 format
        allowNull: false,
        defaultValue: 'US',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'Address',
    }
  )

  Address.associate = (models) => {
    Address.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
  }

  return Address
}
