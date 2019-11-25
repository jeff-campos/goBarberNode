import * as Yup from 'yup';
import {
  startOfHour, parseISO, isBefore, format,
} from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointments from '../models/Appointments';
import Notification from '../schemas/Notification';
import User from '../models/User';
import File from '../models/File';

class AppointmentsController {
  /**
   * Listing logged in user schedules with service providers
   */
  async index(req, res) {
    const { page } = req.query;

    const appointments = await Appointments.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    /**
     * Check if provider_id is provider,
     * and if provider tries to schedule appointment
     */
    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });
    if (!checkIsProvider) {
      return res
        .status(400)
        .json({ error: 'You can only create appointments with providers' });
    } if (provider_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'You cannot create a schedule' });
    }

    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    /**
     * Check date availability
     */

    const ckeckAvailability = await Appointments.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (ckeckAvailability) {
      return res.status(400).json({ error: 'Past dates are not availability' });
    }

    const appointments = await Appointments.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });


    /**
     * Notify appointment Provider
     */


    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "dd 'de' MMMM', às' H:mm'h'",
      { locale: pt },
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para dia ${formattedDate}`,
      user: provider_id,
    });


    return res.json(appointments);
  }
}

export default new AppointmentsController();
