"use client";

// app/termos/page.js
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TermosPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      <header style={{ background: "#1E3A8A", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => window.history.length > 1 ? router.back() : window.close()}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          ← Voltar
        </button>
        <Image src="/logo/logo-app.svg" alt="Pai de Primeira" width={120} height={36} />
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>Termos de Uso</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 40 }}>
          Última atualização: maio de 2026 · Versão 1.0
        </p>

        <Section title="1. Aceitação dos termos">
          <p>Ao criar uma conta e utilizar o aplicativo <strong>Pai de Primeira</strong>, você concorda integralmente com estes Termos de Uso e com nossa <a href="/privacidade" style={{ color: "#1E3A8A" }}>Política de Privacidade</a>.</p>
          <p>Se você não concordar com qualquer disposição destes termos, não utilize o serviço.</p>
        </Section>

        <Section title="2. O serviço">
          <p>O Pai de Primeira é um aplicativo web progressivo (PWA) que oferece conteúdo semanal, ferramentas e recursos para pais de primeira viagem, cobrindo desde a gestação até o primeiro ano do bebê.</p>
          <p>O serviço é oferecido em dois níveis:</p>
          <ul>
            <li><strong>Gratuito</strong> — conteúdo base de todas as semanas, sem custo e sem prazo de expiração</li>
            <li><strong>Premium</strong> — recursos avançados mediante assinatura paga, conforme planos disponíveis em <a href="/planos" style={{ color: "#1E3A8A" }}>/planos</a></li>
          </ul>
        </Section>

        <Section title="3. Cadastro e conta">
          <ul>
            <li>Você deve ter pelo menos 18 anos para criar uma conta</li>
            <li>As informações fornecidas no cadastro devem ser verdadeiras e atualizadas</li>
            <li>Você é responsável pela confidencialidade da sua senha</li>
            <li>Cada conta é pessoal e intransferível</li>
            <li>Você pode ter até 2 sessões ativas simultaneamente em dispositivos diferentes</li>
          </ul>
        </Section>

        <Section title="4. Planos e pagamentos">
          <p>Os planos premium são processados exclusivamente pelo <strong>Mercado Pago</strong>. Ao assinar, você concorda também com os termos de uso do Mercado Pago.</p>
          <ul>
            <li><strong>Plano Mensal</strong> — R$ 19,90/mês</li>
            <li><strong>Plano Trimestral</strong> — R$ 49,90/trimestre</li>
            <li><strong>Jornada Completa</strong> — R$ 129,90, pagamento único, acesso por aproximadamente 22 meses</li>
          </ul>
          <p>Os preços podem ser alterados com aviso prévio de 30 dias por e-mail.</p>
        </Section>

        <Section title="5. Direito de arrependimento e cancelamento">
          <p>Em conformidade com o Código de Defesa do Consumidor (art. 49, CDC) e o Marco Civil da Internet, você tem direito a:</p>
          <ul>
            <li><strong>Cancelamento em até 7 dias</strong> após a contratação, com reembolso integral, sem necessidade de justificativa</li>
            <li>Para cancelar, envie um e-mail para <a href="mailto:contato@apppaideprimeira.com" style={{ color: "#1E3A8A" }}>contato@apppaideprimeira.com</a> com o assunto "Cancelamento" ou use o botão de cancelamento disponível no menu do aplicativo</li>
            <li>O reembolso será processado em até 7 dias úteis após a solicitação</li>
            <li>Após os 7 dias, o acesso premium permanece ativo até o fim do período contratado, sem renovação automática</li>
          </ul>
        </Section>

        <Section title="6. Conteúdo e propriedade intelectual">
          <ul>
            <li>Todo o conteúdo do aplicativo (textos, áudios, vídeos, imagens, checklists) é de propriedade do Pai de Primeira ou licenciado de terceiros</li>
            <li>É proibido reproduzir, distribuir ou comercializar qualquer conteúdo do app sem autorização expressa</li>
            <li>O conteúdo inserido pelo usuário (Diário do Pai, anotações no Planner) permanece de sua propriedade</li>
          </ul>
        </Section>

        <Section title="7. Uso aceitável">
          <p>É proibido utilizar o Pai de Primeira para:</p>
          <ul>
            <li>Compartilhar credenciais de acesso com terceiros</li>
            <li>Tentar acessar conteúdo premium sem assinatura ativa</li>
            <li>Realizar engenharia reversa ou explorar vulnerabilidades do sistema</li>
            <li>Qualquer atividade ilegal ou que viole direitos de terceiros</li>
          </ul>
        </Section>

        <Section title="8. Disponibilidade do serviço">
          <p>Nos esforçamos para manter o serviço disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta, podendo ocorrer interrupções para manutenção, atualizações ou por fatores fora do nosso controle.</p>
          <p>Não nos responsabilizamos por perdas decorrentes de indisponibilidade temporária do serviço.</p>
        </Section>

        <Section title="9. Limitação de responsabilidade">
          <p>O conteúdo do Pai de Primeira tem caráter informativo e educacional. Não substitui acompanhamento médico, psicológico ou de qualquer outro profissional de saúde.</p>
          <p>Não nos responsabilizamos por decisões tomadas com base exclusivamente nas informações do aplicativo.</p>
        </Section>

        <Section title="10. Exclusão de conta">
          <p>Você pode solicitar a exclusão da sua conta a qualquer momento pelo e-mail <a href="mailto:contato@apppaideprimeira.com" style={{ color: "#1E3A8A" }}>contato@apppaideprimeira.com</a>. Os dados serão mantidos por 60 dias após a solicitação e então excluídos permanentemente, salvo obrigações legais de retenção.</p>
          <p>Reservamos o direito de suspender ou encerrar contas que violem estes termos.</p>
        </Section>

        <Section title="11. Alterações nos termos">
          <p>Podemos atualizar estes termos periodicamente. Notificaremos você por e-mail com pelo menos 15 dias de antecedência em caso de alterações relevantes. O uso continuado do serviço após esse prazo implica aceitação dos novos termos.</p>
        </Section>

        <Section title="12. Lei aplicável e foro">
          <p>Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de Porto Alegre/RS para dirimir quaisquer controvérsias, salvo disposição legal em contrário.</p>
        </Section>

        <Section title="13. Contato">
          <p><strong>Pai de Primeira</strong> — Cristiano da Costa de Mello<br />
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