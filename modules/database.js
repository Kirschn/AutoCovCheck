import  SequelizePckg  from 'sequelize';
const { Sequelize, Model, DataTypes } = SequelizePckg;
var sequelize = {}

export default class covcheckDatabase {
    constructor(config) {
        sequelize = new Sequelize(config);
        

    }
    async loadModel() {
        this.event = sequelize.define('event', {
            eventName: {
                type: DataTypes.STRING,
                allowNull: true
            },
            eventStart: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            eventIsActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            entranceTypeName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            entranceWithVac: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            entranceWithRecov: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            entranceWithRAT:  {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            entranceWithNAAT: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            entranceNeedsRAT: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            
            maxRATAge: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            
            maxNAATAge: {
                type: DataTypes.DATE,
                allowNull: true
            },
            checkIdCard: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            logPersons: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            }
        });
        this.eventParticipants = sequelize.define("eventParticipants", {
            "fn": {
                type: DataTypes.STRING
            },
            "gn": {
                type: DataTypes.STRING
            },
            "dob": {
                type: DataTypes.DATE
            }

        })
        this.event.hasMany(this.eventParticipants);
        await sequelize.sync();
    }
    async getRunningEvent() {
        let event = await this.event.findAll(
            {where: {eventIsActive:true},
            order: [["id", "DESC"]],
            limit: 1}
            );
        return event[0].dataValues
    }
    get sequelize() {
        return sequelize;
    }
}