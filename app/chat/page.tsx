import Chat from "@/components/chat";

export default function ChatPage() {
  return (
    <main>
      <Chat messages={[]} onSend={async () => {}} />
    </main>
  );
}
