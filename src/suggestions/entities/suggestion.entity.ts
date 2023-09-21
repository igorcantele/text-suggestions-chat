import { Column, Entity } from 'typeorm';

@Entity()
export class Suggestion {
  @Column()
  key: string;

  @Column()
  sugg: string;

  @Column()
  freq: number;
}
