import json
import os
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.nn.utils.rnn import pad_sequence

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
TRAIN_FILE = os.path.join(os.path.dirname(__file__), 'train_corpus.txt')
VAL_FILE = os.path.join(os.path.dirname(__file__), 'val_corpus.txt')
VOCAB_FILE = os.path.join(os.path.dirname(__file__), 'vocab.json')
CHECKPOINT = os.path.join(MODEL_DIR, 'saigon_lstm.pt')

# Hyperparameters
HIDDEN_SIZE = 512
NUM_LAYERS = 2
DROPOUT = 0.2
BATCH_SIZE = 64
SEQ_LENGTH = 200
EPOCHS = 20
LR = 0.002
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def collate_fn(batch):
    """Custom collate function to handle variable length sequences."""
    xs, ys = zip(*batch)
    
    # Pad sequences to the same length
    xs_padded = pad_sequence(xs, batch_first=True, padding_value=0)
    ys_padded = pad_sequence(ys, batch_first=True, padding_value=0)
    
    return xs_padded, ys_padded


class CharDataset(Dataset):
    def __init__(self, path, vocab, max_len=SEQ_LENGTH):
        with open(path, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f]
        self.vocab = vocab
        self.max_len = max_len
        self.data = []
        
        for line in lines:
            # Truncate sequences that are too long
            if len(line) > max_len:
                line = line[:max_len]
            indices = [vocab.get(ch, vocab['<unk>']) for ch in line]
            if len(indices) > 1:  # Need at least 2 chars for input/target
                self.data.append(torch.tensor(indices, dtype=torch.long))

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        seq = self.data[idx]
        if len(seq) == 1:
            # Handle edge case of single character
            x = seq
            y = seq
        else:
            x = seq[:-1]
            y = seq[1:]
        return x, y


class CharLSTM(nn.Module):
    def __init__(self, vocab_size):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, HIDDEN_SIZE)
        self.lstm = nn.LSTM(
            input_size=HIDDEN_SIZE,
            hidden_size=HIDDEN_SIZE,
            num_layers=NUM_LAYERS,
            dropout=DROPOUT,
            batch_first=True
        )
        self.fc = nn.Linear(HIDDEN_SIZE, vocab_size)

    def forward(self, x, hidden=None):
        x = self.embed(x)
        out, hidden = self.lstm(x, hidden)
        logits = self.fc(out)
        return logits, hidden


def train():
    os.makedirs(MODEL_DIR, exist_ok=True)
    vocab = json.load(open(VOCAB_FILE, 'r', encoding='utf-8'))
    train_ds = CharDataset(TRAIN_FILE, vocab)
    val_ds = CharDataset(VAL_FILE, vocab)
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, collate_fn=collate_fn)

    model = CharLSTM(len(vocab)).to(DEVICE)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss()

    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0
        for x, y in train_loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            optimizer.zero_grad()
            logits, _ = model(x)
            loss = criterion(logits.view(-1, logits.size(-1)), y.view(-1))
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        print(f"Epoch {epoch}/{EPOCHS} - Train Loss: {total_loss/len(train_loader):.4f}")

        # validation
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(DEVICE), y.to(DEVICE)
                logits, _ = model(x)
                loss = criterion(logits.view(-1, logits.size(-1)), y.view(-1))
                val_loss += loss.item()
        print(f"Epoch {epoch}/{EPOCHS} - Val Loss: {val_loss/len(val_loader):.4f}")

        # Save checkpoint each epoch
        torch.save({
            'model_state_dict': model.state_dict(),
            'vocab': vocab
        }, CHECKPOINT)
    print(f"Training complete. Model saved to {CHECKPOINT}")


if __name__ == '__main__':
    train()
