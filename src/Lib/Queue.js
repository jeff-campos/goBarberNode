import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import redisConfig from '../config/redis';

const jobs = [CancellationMail];

class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach((job) => {
      const { bee, handle } = this.queues[job.key];

      bee.on('failed', this.handleFailed).process(handle);
    });
  }

  handleFailed(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }
}

export default new Queue();


/**
 * Todo job passa pelo metodo init que adiciona no this.queues um objeto contendo
 * a instancia de BEE passando o nome do job e a configuração do redis no primeiro
 * parametro, no segundo, handle que é nosso que quarda o metodo sendMail, contendo
 * todos as informações do email que sejá disparado.
 *
 * O metodo add, aciona um job no redis, ele percorre a variavel this.queues que
 * tem as informações citadas acima. Cria um "job" atraves do método createJOB e salva
 * no banco Redis
 *
 * O metodo processQueue, por sua vez, percorre mais uma vez a variavel que quarda
 * todos os jobs, especificamente, a fila do job em questão, passado no parametro da função
 * e processa.
 *
 *
 * Na pratica, o Bee Queue vai ajudar a organizar uma fila de processamento de trabalhos
 * Os trabalhos são diversos, neste caso, temos só o trabalho de Cancelamento de email.
 * Quando essa classe for acionada, ela deve adicionar um pedido de disparo de
 * email no banco redis e ir processando, caso falhe, isso fica no banco, só sai
 * se for processado com sucesso o job.
 *
 *
 * A ideia de usar o Redis com o Bee Queue para executar essas tarefas é onerar
 * menos a executação da aplicação no servidor e deixar que isso sejá feito as
 * margens do serviço da aplicação mesmo. Na aplicação GoBarber, vamos apenas
 * solicitar a cada cancelamento o pedido de envio de um email, não vamos aguardar
 * esse email ser enviado, ele será colocado em uma fila, que processará essa
 * tarefa em um outro tempo, em segundo plano. Esse segundo plano e como funciona
 * descrevi acima.
 */
