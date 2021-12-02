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
                allowNull: false,
                defaultValue: "AutoCovCheck"
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
                allowNull: true,
                defaultValue: ""
            },
            entranceWithVac: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            entranceWithRecov: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            entranceWithRAT:  {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            entranceWithNAAT: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            entranceNeedsRAT: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            
            maxRATAge: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 24
            },
            
            maxNAATAge: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 72
            },
            checkIdCard: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            logPersons: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        });
        this.eventParticipant = sequelize.define("eventParticipant", {
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
        this.event.hasMany(this.eventParticipant);
        this.eventParticipant.belongsTo(this.event)
        await sequelize.sync();
        let events = await this.event.findAll();
        if (events[0] == undefined) {
            this.event.create({
                eventName: "Testevent",
                entranceTypeName: "2G",
                entranceWithVac: true,
                entranceWithRecov: true,
                entranceWithRAT: false,
                entranceWithNAAT: false,
                entranceNeedsRAT: false,
                maxRATAge: 24,
                checkIdCard: false,
                logPersons: false
            })
        }
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