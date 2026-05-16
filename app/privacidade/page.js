"use client";

// app/privacidade/page.js
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PrivacidadePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      <header style={{ background: "#1E3A8A", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          ← Voltar
        </button>
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={120} height={36} />
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>Política de Privacidade</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 40 }}>
          Última atualização: maio de 2026 · Versão 1.0
        </p>

        <Section title="1. Quem somos">
          <p>O <strong>Pai de Primeira</strong> é um aplicativo desenvolvido e operado por <strong>Cristiano da Costa de Mello</strong>, pessoa física, com domicílio em Porto Alegre/RS, Brasil.</p>
          <p>Para dúvidas, solicitações e exercício de direitos relacionados à privacidade, entre em contato pelo e-mail: <a href="mailto:contato@apppaideprimeira.com" style={{ color: "#1E3A8A" }}>contato@apppaideprimeira.com</a></p>
        </Section>

        <Section title="2. Quais dados coletamos">
          <p>Coletamos apenas os dados necessários para a prestação do serviço:</p>
          <SubSection title="Dados fornecidos pelo usuário">
            <ul>
              <li><strong>Nome</strong> (opcional) — para personalização da experiência</li>
              <li><strong>Endereço de e-mail</strong> — para criação e acesso à conta</li>
              <li><strong>Senha</strong> — armazenada de forma criptografada, nunca em texto puro</li>
              <li><strong>Data provável do parto</strong> — para calcular a semana gestacional</li>
              <li><strong>Data de nascimento do bebê</strong> — para iniciar a jornada pós-parto</li>
              <li><strong>Datas de aniversário</strong> (opcional) — da esposa/companheira e dos filhos, para lembretes personalizados</li>
              <li><strong>Data de nascimento do próprio usuário</strong> (opcional) — para lembretes</li>
            </ul>
          </SubSection>
          <SubSection title="Dados gerados pelo uso">
            <ul>
              <li>Progresso na jornada (semana atual, conteúdos visualizados)</li>
              <li>Entradas no Diário do Pai</li>
              <li>Eventos e marcos no Planner</li>
              <li>Subscription de notificações push (endpoint do dispositivo)</li>
              <li>Informações de pagamento processadas pelo Mercado Pago (não armazenamos dados de cartão)</li>
            </ul>
          </SubSection>
          <SubSection title="Dados armazenados apenas no seu dispositivo">
            <ul>
              <li>Registros de amamentação, fraldas e sono do bebê — ficam exclusivamente no armazenamento local do seu dispositivo (localStorage) e não são enviados aos nossos servidores</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="3. Como usamos seus dados">
          <ul>
            <li>Criar e gerenciar sua conta de acesso</li>
            <li>Personalizar o conteúdo conforme a semana da sua jornada</li>
            <li>Enviar notificações push com avisos semanais (somente com sua autorização)</li>
            <li>Processar pagamentos e gerenciar assinaturas premium</li>
            <li>Enviar lembretes de datas importantes (somente com sua autorização)</li>
            <li>Responder suas solicitações de suporte</li>
          </ul>
          <p>Não utilizamos seus dados para fins publicitários, não vendemos dados a terceiros e não realizamos perfilamento automatizado.</p>
        </Section>

        <Section title="4. Base legal para o tratamento">
          <p>Tratamos seus dados com base nas seguintes hipóteses previstas na LGPD (Lei nº 13.709/2018):</p>
          <ul>
            <li><strong>Execução de contrato</strong> — para fornecer o serviço contratado (art. 7º, V)</li>
            <li><strong>Consentimento</strong> — para notificações push e lembretes opcionais (art. 7º, I)</li>
            <li><strong>Legítimo interesse</strong> — para segurança da conta e melhoria do serviço (art. 7º, IX)</li>
          </ul>
        </Section>

        <Section title="5. Compartilhamento de dados">
          <p>Compartilhamos dados apenas com os fornecedores estritamente necessários para o funcionamento do serviço:</p>
          <ul>
            <li><strong>Supabase</strong> — banco de dados e autenticação (servidores nos EUA, com adequação às normas internacionais de proteção de dados)</li>
            <li><strong>Vercel</strong> — hospedagem da aplicação (servidores nos EUA)</li>
            <li><strong>Mercado Pago</strong> — processamento de pagamentos (servidores no Brasil/Argentina)</li>
            <li><strong>Hostinger</strong> — serviço de e-mail transacional</li>
          </ul>
          <p>Não compartilhamos seus dados com anunciantes, parceiros comerciais ou quaisquer outros terceiros sem o seu consentimento expresso.</p>
        </Section>

        <Section title="6. Retenção de dados">
          <ul>
            <li>Enquanto sua conta estiver ativa, seus dados são mantidos para prestação do serviço</li>
            <li>Após o cancelamento da conta ou encerramento da jornada, seus dados são mantidos por <strong>60 dias</strong> e então excluídos permanentemente</li>
            <li>Dados de pagamento ficam retidos pelo prazo legal exigido pela legislação fiscal brasileira (5 anos)</li>
          </ul>
        </Section>

        <Section title="7. Seus direitos como titular">
          <p>Nos termos da LGPD, você tem direito a:</p>
          <ul>
            <li><strong>Acesso</strong> — saber quais dados temos sobre você</li>
            <li><strong>Correção</strong> — corrigir dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Exclusão</strong> — solicitar a exclusão dos seus dados</li>
            <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado</li>
            <li><strong>Revogação do consentimento</strong> — retirar consentimentos dados anteriormente</li>
            <li><strong>Oposição</strong> — opor-se ao tratamento em casos previstos em lei</li>
          </ul>
          <p>Para exercer qualquer desses direitos, envie um e-mail para <a href="mailto:contato@apppaideprimeira.com" style={{ color: "#1E3A8A" }}>contato@apppaideprimeira.com</a>. Responderemos em até 15 dias úteis.</p>
        </Section>

        <Section title="8. Segurança dos dados">
          <ul>
            <li>Senhas criptografadas via Supabase Auth — nunca armazenadas em texto puro</li>
            <li>Comunicações protegidas por HTTPS/TLS em todas as rotas</li>
            <li>Acesso ao banco de dados restrito por Row Level Security (RLS)</li>
            <li>Chaves de API sensíveis armazenadas como variáveis de ambiente, nunca no código-fonte</li>
            <li>Controle de sessões ativas por dispositivo</li>
          </ul>
          <p>Em caso de incidente de segurança que possa afetar seus dados, notificaremos você e a ANPD nos prazos legais.</p>
        </Section>

        <Section title="9. Notificações push">
          <p>As notificações push são enviadas apenas com sua autorização expressa, concedida dentro do aplicativo. Você pode revogar essa autorização a qualquer momento nas configurações do seu navegador ou dispositivo, ou acessando o menu do usuário no app.</p>
        </Section>

        <Section title="10. Crianças e adolescentes">
          <p>O Pai de Primeira é destinado exclusivamente a adultos maiores de 18 anos. Não coletamos dados de crianças ou adolescentes diretamente. As datas de nascimento de filhos informadas no app são utilizadas exclusivamente para personalizar a jornada do pai, conforme seu consentimento.</p>
        </Section>

        <Section title="11. Alterações nesta política">
          <p>Esta política pode ser atualizada periodicamente. Notificaremos você sobre alterações relevantes por e-mail ou por notificação no aplicativo. O uso continuado do serviço após a notificação implica aceitação das alterações.</p>
        </Section>

        <Section title="12. Contato e encarregado de dados (DPO)">
          <p>Responsável pelo tratamento de dados:</p>
          <p><strong>Cristiano da Costa de Mello</strong><br />
          Porto Alegre, RS — Brasil<br />
          E-mail: <a href="mailto:contato@apppaideprimeira.com" style={{ color: "#1E3A8A" }}>contato@apppaideprimeira.com</a></p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1E3A8A", marginBottom: 14, paddingBottom: 8, borderBottom: "2px solid #dbeafe" }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{title}</p>
      {children}
    </div>
  );
}