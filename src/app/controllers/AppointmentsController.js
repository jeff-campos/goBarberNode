import * as Yup from 'yup';
import {
  startOfHour, parseISO, isBefore, format, subHours,
} from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointments from '../models/Appointments';
import Notification from '../schemas/Notification';
import User from '../models/User';
import File from '../models/File';
import Mail from '../../Lib/Mail';

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

  async delete(req, res) {
    const appointment = await Appointments.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You dont't have permission to cancel this appointments.",
      });
    }

    const dateWithSub = subHours(appointment.date, 2);
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can ony cancel appointments 2 hours in advance.',
      });
    }

    appointment.canceled_at = '2019-11-26T00:00:00.000Z';

    await appointment.save();

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: `Agendamento cancelado de ${appointment.provider.name}`,
      text: 'Você tem um novo agendamento',
    });

    return res.json(appointment);
  }
}

export default new AppointmentsController();
